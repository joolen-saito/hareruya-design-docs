# codex 批判的レビュー記録（設計書 vs ec-cube-enterprise 差分監査）

各機能の findings を codex CLI (gpt-5.5, read-only) が独立に批判的レビュー。誤検知(FALSE_POSITIVE)/見落とし(MISSED)/根拠不備(WEAK_EVIDENCE)/重要度(SEVERITY)の観点。


## a05-01_api_order_print_direct

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
FALSE_POSITIVE | 全finding | 誤検知は確認できません。7件とも参照行は実在し、別ルート・別実装で設計どおり実現している根拠も見つかりませんでした。 | `OrderController.php:43`, `OrderDirectPrintAction.php:44`, `OrderRepository.php:1508`, `OrderRepository.php:1565` | 候補は基本的に維持。

WEAK_EVIDENCE | 全finding | designRef/implRefの不存在、引用の創作、参照先の的外れは確認できません。 | `a05-01_api_order_print_direct.html:238`, `:247`, `:249`, `:265`, `:298`, `:310`; `OrderController.php:43`, `:57`, `:91`; `OrderDirectPrintAction.php:74`, `:97`, `:129`; `UpdatePrintedOrderStatusAction.php:91` | 根拠不備としての修正は不要。

MISSED | ④DBカラム・DB操作 | 設計書のDB操作節は「本機能は参照系であり、DBへの登録・更新・削除は行わない」と書く一方、実装はSetResponseで受注を更新する。既存findingは日時列差分を指摘しているが、このDB操作節そのものとの不一致、かつ設計書内部の矛盾を明示していない。 | `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:87`, `UpdatePrintedOrderStatusAction.php:90`, `UpdatePrintedOrderStatusAction.php:99` | findingsに「DB操作節の記載は処理フロー/副作用節と矛盾。実装差分として扱う場合は設計側の正本解釈が必要」と追記。

SEVERITY | ④DBカラム・DB操作 | UpdatePrintedOrderStatusActionの日時列差分はmed据え置きが妥当。設計の処理フローはconfirm_date、DBカラム節はpicking_date・pick_finish_date、DB操作節は更新なしで揺れており、high断定は根拠が弱い。 | `a05-01_api_order_print_direct.html:249`, `a05-01_api_order_print_direct.html:310`, `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:91` | severityはmed維持。設計の列指定を先に確定する。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
85,525
FALSE_POSITIVE | 全finding | 誤検知は確認できません。7件とも参照行は実在し、別ルート・別実装で設計どおり実現している根拠も見つかりませんでした。 | `OrderController.php:43`, `OrderDirectPrintAction.php:44`, `OrderRepository.php:1508`, `OrderRepository.php:1565` | 候補は基本的に維持。

WEAK_EVIDENCE | 全finding | designRef/implRefの不存在、引用の創作、参照先の的外れは確認できません。 | `a05-01_api_order_print_direct.html:238`, `:247`, `:249`, `:265`, `:298`, `:310`; `OrderController.php:43`, `:57`, `:91`; `OrderDirectPrintAction.php:74`, `:97`, `:129`; `UpdatePrintedOrderStatusAction.php:91` | 根拠不備としての修正は不要。

MISSED | ④DBカラム・DB操作 | 設計書のDB操作節は「本機能は参照系であり、DBへの登録・更新・削除は行わない」と書く一方、実装はSetResponseで受注を更新する。既存findingは日時列差分を指摘しているが、このDB操作節そのものとの不一致、かつ設計書内部の矛盾を明示していない。 | `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:87`, `UpdatePrintedOrderStatusAction.php:90`, `UpdatePrintedOrderStatusAction.php:99` | findingsに「DB操作節の記載は処理フロー/副作用節と矛盾。実装差分として扱う場合は設計側の正本解釈が必要」と追記。

SEVERITY | ④DBカラム・DB操作 | UpdatePrintedOrderStatusActionの日時列差分はmed据え置きが妥当。設計の処理フローはconfirm_date、DBカラム節はpicking_date・pick_finish_date、DB操作節は更新なしで揺れており、high断定は根拠が弱い。 | `a05-01_api_order_print_direct.html:249`, `a05-01_api_order_print_direct.html:310`, `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:91` | severityはmed維持。設計の列指定を先に確定する。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## a05-02_api_order_print_direct

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=1 / 総合=要修正


```
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ④DB操作 | 設計書内の「DB操作」節は「DBへの登録・更新・削除は行わない」「検索のみ」としているが、実装は`SetResponse`で受注を更新する。なお同じ設計書の処理フロー/副作用/DBカラム節は更新を要求しており、設計内部矛盾でもあるため、この節だけを正にすると候補JSONのDB更新系findingと衝突する。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:311`, `:312`, `:313`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87`, `:90`, `:93`, `:96`, `:99` | 設計書のDB操作節を「SetResponseは更新あり」に修正し、候補JSONにも設計内部矛盾または節単位差分として追記する。
SEVERITY | ⑦エラー処理・応答 | `ConnectionType`不一致時の「応答なし」vs HTTP 400は差分としては正しいが、通常系業務データを破壊せず、想定外入力時の互換性問題に限られる。`med`はやや重く、`low`相当が妥当。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:265`, `:302`, `:319`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:91`-`:96` | severityを`low`へ下げる。プリンタクライアントが不正ConnectionType時の無応答を契約として依存している根拠があるなら`med`維持。
WEAK_EVIDENCE | 全般 | JSONの`designRef`はMarkdown行を指しているが、今回の検証対象として指定された正本はHTML。Markdown参照自体は実在し内容も概ね一致するため誤りではないが、監査成果物としてはHTML行番号も併記しないと指定手順上の根拠が弱い。 | Markdown例: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-api/a05-02_api_order_print_direct.md:71`; HTML対応: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:238` | findingsの根拠欄をHTML行番号へ差し替えるか、Markdown/HTMLの両方を併記する。

FALSE_POSITIVEは確認できませんでした。7件の候補差分は、ルート/メソッド、印刷ログ未実装、`picking_date`/`pick_finish_date`/`confirm_date`更新差、支店側スムーズ店頭受取抽出漏れ、合計金額文言置換漏れ、店頭注文番号欄、`ConnectionType`不一致時400応答のいずれも、指定実装上は概ね成立しています。

VERDICT: false_positive=0, missed=1, weak_evidence=1, 総合=要修正
tokens used
87,803
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ④DB操作 | 設計書内の「DB操作」節は「DBへの登録・更新・削除は行わない」「検索のみ」としているが、実装は`SetResponse`で受注を更新する。なお同じ設計書の処理フロー/副作用/DBカラム節は更新を要求しており、設計内部矛盾でもあるため、この節だけを正にすると候補JSONのDB更新系findingと衝突する。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:311`, `:312`, `:313`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87`, `:90`, `:93`, `:96`, `:99` | 設計書のDB操作節を「SetResponseは更新あり」に修正し、候補JSONにも設計内部矛盾または節単位差分として追記する。
SEVERITY | ⑦エラー処理・応答 | `ConnectionType`不一致時の「応答なし」vs HTTP 400は差分としては正しいが、通常系業務データを破壊せず、想定外入力時の互換性問題に限られる。`med`はやや重く、`low`相当が妥当。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:265`, `:302`, `:319`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:91`-`:96` | severityを`low`へ下げる。プリンタクライアントが不正ConnectionType時の無応答を契約として依存している根拠があるなら`med`維持。
WEAK_EVIDENCE | 全般 | JSONの`designRef`はMarkdown行を指しているが、今回の検証対象として指定された正本はHTML。Markdown参照自体は実在し内容も概ね一致するため誤りではないが、監査成果物としてはHTML行番号も併記しないと指定手順上の根拠が弱い。 | Markdown例: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-api/a05-02_api_order_print_direct.md:71`; HTML対応: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:238` | findingsの根拠欄をHTML行番号へ差し替えるか、Markdown/HTMLの両方を併記する。

FALSE_POSITIVEは確認できませんでした。7件の候補差分は、ルート/メソッド、印刷ログ未実装、`picking_date`/`pick_finish_date`/`confirm_date`更新差、支店側スムーズ店頭受取抽出漏れ、合計金額文言置換漏れ、店頭注文番号欄、`ConnectionType`不一致時400応答のいずれも、指定実装上は概ね成立しています。

VERDICT: false_positive=0, missed=1, weak_evidence=1, 総合=要修正
```


## a05-04_api_order_order_smaregi_receive

**VERDICT**: 誤検知=0 / 見落とし=3 / 根拠不備=1 / 総合=要修正


```
FALSE_POSITIVE は確認できませんでした。主要候補は概ね実装根拠あり。ただし1件は根拠の扱いが弱く、重要な見落としが複数あります。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
- WEAK_EVIDENCE | ④DBカラム・DB操作（注文サブ） | `dtb_order_sub` 不在を「確定差分」とするのは弱い。設計自身が移行先は「実装で要確認」としており、正本上も未確定項目。 | [a05-04 HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:281), [Markdown](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:195) | findingはCONFIRMEDではなく「要確認/open item」または低重要度へ落とす。
- MISSED | ログ・監査 | 設計は連携用ヘッダ/Cookie完全値をログ出力禁止としているが、実装は受信時・認証失敗時に全headersとcontentをログへ出す。`X_access_token`、Cookie、秘密ヘッダ混入の可能性がある。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:292), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:44), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52) | 高優先でfinding追加。ログ前に認証/連携ヘッダ・Cookie・本文内機微値をマスクする。
- MISSED | バリデーション/エラー処理 | 設計は取引ヘッダ不足を500相当としているが、実装は`transactionHeadIds`欠落時に後段ハンドラで警告してreturnし、親ジョブは完了扱いになり得る。HTTP応答も受信時点では200。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:257), [TransactionEventDispatcher.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89), [CreatedHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47), [SmaregiWebhookEventMessageHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:104) | finding追加。欠落時の期待ステータスを設計/実装どちらへ合わせるか決める。
- MISSED | 排他制御・トランザクション | 設計は明示的な悲観/楽観ロックなしとしているが、実装は会員ポイント更新で明示トランザクションと`PESSIMISTIC_WRITE`を使う。冪等性・デッドロック・待機挙動に関わる差分。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:297), [SmaregiOrderPointApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:99), [SmaregiPointAdjustmentApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:132) | finding追加。設計を現行実装に合わせるか、ロック不要仕様なら実装差分として扱う。

VERDICT: false_positive=0, missed=3, weak_evidence=1, 総合=要修正
tokens used
132,958
FALSE_POSITIVE は確認できませんでした。主要候補は概ね実装根拠あり。ただし1件は根拠の扱いが弱く、重要な見落としが複数あります。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
- WEAK_EVIDENCE | ④DBカラム・DB操作（注文サブ） | `dtb_order_sub` 不在を「確定差分」とするのは弱い。設計自身が移行先は「実装で要確認」としており、正本上も未確定項目。 | [a05-04 HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:281), [Markdown](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:195) | findingはCONFIRMEDではなく「要確認/open item」または低重要度へ落とす。
- MISSED | ログ・監査 | 設計は連携用ヘッダ/Cookie完全値をログ出力禁止としているが、実装は受信時・認証失敗時に全headersとcontentをログへ出す。`X_access_token`、Cookie、秘密ヘッダ混入の可能性がある。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:292), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:44), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52) | 高優先でfinding追加。ログ前に認証/連携ヘッダ・Cookie・本文内機微値をマスクする。
- MISSED | バリデーション/エラー処理 | 設計は取引ヘッダ不足を500相当としているが、実装は`transactionHeadIds`欠落時に後段ハンドラで警告してreturnし、親ジョブは完了扱いになり得る。HTTP応答も受信時点では200。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:257), [TransactionEventDispatcher.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89), [CreatedHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47), [SmaregiWebhookEventMessageHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:104) | finding追加。欠落時の期待ステータスを設計/実装どちらへ合わせるか決める。
- MISSED | 排他制御・トランザクション | 設計は明示的な悲観/楽観ロックなしとしているが、実装は会員ポイント更新で明示トランザクションと`PESSIMISTIC_WRITE`を使う。冪等性・デッドロック・待機挙動に関わる差分。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:297), [SmaregiOrderPointApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:99), [SmaregiPointAdjustmentApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:132) | finding追加。設計を現行実装に合わせるか、ロック不要仕様なら実装差分として扱う。

VERDICT: false_positive=0, missed=3, weak_evidence=1, 総合=要修正
```


## admin_customer_point

**VERDICT**: 誤検知=1 / 見落とし=1 / 根拠不備=2 / 総合=要修正


```
WEAK_EVIDENCE | ③バリデーション | 備考の「自由入力不可」は根拠が弱い。設計は「備考 任意」「最大長 実装確認値」としているが、自由入力でなければならないとは明記していない。ただし「任意」に対して実装が `required=true` + `NotBlank` なのは有効な差分。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:250`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:85`, `:87`, `:91` | finding文言を「自由入力不可」ではなく「必須化・固定選択肢化」と分け、自由入力要件は確認不能にする。

WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | スマレジ連携の差分は根拠がやや弱い。設計の該当行は「本書では仕様確定せず、実装または別機能の設計を正とする」「スマレジポイント連携はポイント連携バッチを正」としており、単純な禁止仕様とは読めない。一方で実装がスマレジ連携ジョブを登録・dispatchしている事実は確認できる。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:223`, `:224`, `:257`, `:260`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91`, `:92`, `:96` | 「設計違反」断定ではなく「本書対象外処理が混在。別仕様で正当化されるか確認不能」とする。

FALSE_POSITIVE | ①ルート/HTTPメソッド | 「種別マスタ由来の可変種別ではなくハードコード限定」は誤検知寄り。設計は「ポイント種別はポイント種別マスタを参照」とだけ書いており、任意追加マスタをURLで可変対応する要件は確認できない。実装マスタも付与型・購入型の2件で、実装の `granted|purchase` 固定と直ちに矛盾とは言えない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:28`, `:31`, `/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:62` | findingは削除、または「マスタをリポジトリから動的取得していない」程度に弱める。

SEVERITY | ①ルート/HTTPメソッド | POSTパスの `/update/` セグメント欠落は設計との差分として有効だが、実装内のルート名とフォームactionは整合しており、画面操作上の即時障害とは限らない。`med` はやや高い可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:235`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18` | 外部URL契約を重視するならmed維持、管理画面内遷移のみならlowへ下げる。

MISSED | ④DBカラム・DB操作・テーブル | 候補は履歴の種別フィルタ欠如を指摘しているが、「履歴画面への直リンク」が全履歴表示になっている点を別差分として落としている。設計は「ポイント種別ごとに履歴を確認」とするが、会員編集画面の「ポイント履歴」は `type=history` で全履歴を開く。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:212`, `:248`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1042`, `:1043`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123` | 「type=history による全履歴表示が設計の種別別履歴と衝突」を追加する。

VERDICT: false_positive=1, missed=1, weak_evidence=2, 総合=要修正
tokens used
63,739
WEAK_EVIDENCE | ③バリデーション | 備考の「自由入力不可」は根拠が弱い。設計は「備考 任意」「最大長 実装確認値」としているが、自由入力でなければならないとは明記していない。ただし「任意」に対して実装が `required=true` + `NotBlank` なのは有効な差分。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:250`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:85`, `:87`, `:91` | finding文言を「自由入力不可」ではなく「必須化・固定選択肢化」と分け、自由入力要件は確認不能にする。

WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | スマレジ連携の差分は根拠がやや弱い。設計の該当行は「本書では仕様確定せず、実装または別機能の設計を正とする」「スマレジポイント連携はポイント連携バッチを正」としており、単純な禁止仕様とは読めない。一方で実装がスマレジ連携ジョブを登録・dispatchしている事実は確認できる。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:223`, `:224`, `:257`, `:260`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91`, `:92`, `:96` | 「設計違反」断定ではなく「本書対象外処理が混在。別仕様で正当化されるか確認不能」とする。

FALSE_POSITIVE | ①ルート/HTTPメソッド | 「種別マスタ由来の可変種別ではなくハードコード限定」は誤検知寄り。設計は「ポイント種別はポイント種別マスタを参照」とだけ書いており、任意追加マスタをURLで可変対応する要件は確認できない。実装マスタも付与型・購入型の2件で、実装の `granted|purchase` 固定と直ちに矛盾とは言えない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:28`, `:31`, `/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:62` | findingは削除、または「マスタをリポジトリから動的取得していない」程度に弱める。

SEVERITY | ①ルート/HTTPメソッド | POSTパスの `/update/` セグメント欠落は設計との差分として有効だが、実装内のルート名とフォームactionは整合しており、画面操作上の即時障害とは限らない。`med` はやや高い可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:235`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18` | 外部URL契約を重視するならmed維持、管理画面内遷移のみならlowへ下げる。

MISSED | ④DBカラム・DB操作・テーブル | 候補は履歴の種別フィルタ欠如を指摘しているが、「履歴画面への直リンク」が全履歴表示になっている点を別差分として落としている。設計は「ポイント種別ごとに履歴を確認」とするが、会員編集画面の「ポイント履歴」は `type=history` で全履歴を開く。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:212`, `:248`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1042`, `:1043`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123` | 「type=history による全履歴表示が設計の種別別履歴と衝突」を追加する。

VERDICT: false_positive=1, missed=1, weak_evidence=2, 総合=要修正
```


## admin_product_sale_high_price_csv_export

**VERDICT**: 誤検知=0 / 見落とし=2 / 根拠不備=0 / 総合=要修正


```
FALSE_POSITIVE | なし | 候補2件はいずれも誤検知ではない。設計行・実装行とも実在し、内容も一致していない | `admin_product_sale_high_price_csv_export.html:234`, `ProductSaleHighPriceCsvController.php:180`, `admin_product_sale_high_price_csv_export.html:235`, `ProductSaleHighPriceCsvController.php:194` | 候補は維持

WEAK_EVIDENCE | なし | designRef/implRef は存在し、引用趣旨も確認できる。行番号も大きなズレなし | `ProductSaleHighPriceCsvController.php:55`, `AbstractController.php:431` で `getCsvHeader()` のキーが雛形CSVに出力されることも確認 | 根拠不備扱い不要

MISSED | フロント挙動・画面フォーマット表 | findingsは雛形CSVヘッダ欠落と必須バッジ欠落を指摘しているが、アップロード画面のフォーマット表自体も同じ `headers` で描画されるため、設計上の7行ではなく5行表示になる差分が未記載 | 設計: `admin_product_sale_high_price_csv_export.html:233-235`、実装: `ProductSaleHighPriceCsvController.php:83-88`, `base_csv_upload.twig:95-107` | 画面表示行の欠落も別差分として追加

MISSED | データ整合性・取込との一致 | 設計は「ヘッダ列名および列順は取込ハンドラが期待する日本語列名と揃える」とするが、実装の取込ハンドラ自体も `商品コード/販売価格/セールフラグ/帯URL/タグ(ID)` の5列のみで、設計の `買取価格` と `スマレジ連携フラグ` を期待していない。候補は雛形側だけを指摘し、この取込側の設計差分を落としている | 設計: `admin_product_sale_high_price_csv_export.html:238-239`、実装: `SaleHighPriceImportHandler.php:51-55`, `SaleHighPriceImportHandler.php:165-173` | 取込ハンドラ列定義も差分として追加

SEVERITY | ② 業務ルール・計算 / ③ バリデーション | high は概ね妥当。設計が正ならCSV契約の列数・必須列が欠け、利用者が設計どおりの雛形を取得できない。ただし実装の取込側も5列仕様になっているため、「取込失敗を直接誘発する」という根拠は確認不能 | `ProductSaleHighPriceCsvController.php:180-186`, `ProductSaleHighPriceCsvController.php:194-198`, `SaleHighPriceImportHandler.php:51-55` | high維持。ただし業務影響説明は「設計CSV契約不一致」に寄せる

VERDICT: false_positive=0, missed=2, weak_evidence=0, 総合=要修正
tokens used
60,592
FALSE_POSITIVE | なし | 候補2件はいずれも誤検知ではない。設計行・実装行とも実在し、内容も一致していない | `admin_product_sale_high_price_csv_export.html:234`, `ProductSaleHighPriceCsvController.php:180`, `admin_product_sale_high_price_csv_export.html:235`, `ProductSaleHighPriceCsvController.php:194` | 候補は維持

WEAK_EVIDENCE | なし | designRef/implRef は存在し、引用趣旨も確認できる。行番号も大きなズレなし | `ProductSaleHighPriceCsvController.php:55`, `AbstractController.php:431` で `getCsvHeader()` のキーが雛形CSVに出力されることも確認 | 根拠不備扱い不要

MISSED | フロント挙動・画面フォーマット表 | findingsは雛形CSVヘッダ欠落と必須バッジ欠落を指摘しているが、アップロード画面のフォーマット表自体も同じ `headers` で描画されるため、設計上の7行ではなく5行表示になる差分が未記載 | 設計: `admin_product_sale_high_price_csv_export.html:233-235`、実装: `ProductSaleHighPriceCsvController.php:83-88`, `base_csv_upload.twig:95-107` | 画面表示行の欠落も別差分として追加

MISSED | データ整合性・取込との一致 | 設計は「ヘッダ列名および列順は取込ハンドラが期待する日本語列名と揃える」とするが、実装の取込ハンドラ自体も `商品コード/販売価格/セールフラグ/帯URL/タグ(ID)` の5列のみで、設計の `買取価格` と `スマレジ連携フラグ` を期待していない。候補は雛形側だけを指摘し、この取込側の設計差分を落としている | 設計: `admin_product_sale_high_price_csv_export.html:238-239`、実装: `SaleHighPriceImportHandler.php:51-55`, `SaleHighPriceImportHandler.php:165-173` | 取込ハンドラ列定義も差分として追加

SEVERITY | ② 業務ルール・計算 / ③ バリデーション | high は概ね妥当。設計が正ならCSV契約の列数・必須列が欠け、利用者が設計どおりの雛形を取得できない。ただし実装の取込側も5列仕様になっているため、「取込失敗を直接誘発する」という根拠は確認不能 | `ProductSaleHighPriceCsvController.php:180-186`, `ProductSaleHighPriceCsvController.php:194-198`, `SaleHighPriceImportHandler.php:51-55` | high維持。ただし業務影響説明は「設計CSV契約不一致」に寄せる

VERDICT: false_positive=0, missed=2, weak_evidence=0, 総合=要修正
```


## admin_product_simple_low_price_csv_export

**VERDICT**: 誤検知=0 / 見落とし=0 / 根拠不備=3 / 総合=要修正


```
監査結果: 大筋では「低価格帯カード価格変更CSV出力は実装不在」というfindingは妥当です。誤検知は確認できませんでした。ただし、根拠の置き方に弱い箇所があります。

- WEAK_EVIDENCE | ①ルート/HTTPメソッド | designRef `:198` は機能目的であり、URL/route名/HTTPメソッドの根拠ではありません。設計書自身も「実装で確認できるURLは未特定のため断定しない」としているため、`admin_product_simple_low_price_csv_export` というroute想定は確認不能です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:198`, `:208` | dimensionを「機能不在」または「画面/CSV出力機能不在」に変更し、route名断定は削除する。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | implRef が `ProductSimpleHighPriceCsvController.php:184` になっていますが、これは高額商品のCSVアップロード/雛形であり、対象機能そのものではありません。比較対象としては参考になるが、低価格帯CSV出力の直接根拠ではありません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184`, `:186` | 「近似実装との比較」と明記し、主根拠は対象名検索0件、Controller一覧、`MtbCsvImportType`に低価格帯定数なしへ寄せる。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | 「CsvExportService経由stream出力」は設計書の該当CSV列定義からは確認できません。設計で確認できるのは9列フォーマットと新/現行価格・原価単価の出力要件です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:314`, `:318`, `:322` | 実装方式の断定を削り、「9列フォーマットの出力実装が確認できない」に留める。

- SEVERITY | ①ルート/HTTPメソッド | severity high は「機能丸ごと不在」としては妥当ですが、dimension がルート/HTTPメソッドのままだとhighは過大に見えます。設計はURL未特定で、HTTPメソッド仕様もありません。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:195`, `:208`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` | severityは維持可。ただしdimensionを機能不在に修正する。

確認できた補強根拠:
- 設計は低価格帯20円から300円以下、週間販売/全店在庫によるランク変動、ランク `300,250,200,150,100,80,50,30` を要求しています。根拠: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:259`, `:263`
- 既存の基準価格CSV登録はCSV値とカード状態割引から算出する処理で、低価格帯ランク変動ではありません。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:39`
- CSV import type 定数にも低価格帯相当は確認できず、既存は `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID` などまでです。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28`

VERDICT: false_positive=0, missed=0, weak_evidence=3, 総合=要修正
tokens used
111,035
監査結果: 大筋では「低価格帯カード価格変更CSV出力は実装不在」というfindingは妥当です。誤検知は確認できませんでした。ただし、根拠の置き方に弱い箇所があります。

- WEAK_EVIDENCE | ①ルート/HTTPメソッド | designRef `:198` は機能目的であり、URL/route名/HTTPメソッドの根拠ではありません。設計書自身も「実装で確認できるURLは未特定のため断定しない」としているため、`admin_product_simple_low_price_csv_export` というroute想定は確認不能です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:198`, `:208` | dimensionを「機能不在」または「画面/CSV出力機能不在」に変更し、route名断定は削除する。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | implRef が `ProductSimpleHighPriceCsvController.php:184` になっていますが、これは高額商品のCSVアップロード/雛形であり、対象機能そのものではありません。比較対象としては参考になるが、低価格帯CSV出力の直接根拠ではありません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184`, `:186` | 「近似実装との比較」と明記し、主根拠は対象名検索0件、Controller一覧、`MtbCsvImportType`に低価格帯定数なしへ寄せる。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | 「CsvExportService経由stream出力」は設計書の該当CSV列定義からは確認できません。設計で確認できるのは9列フォーマットと新/現行価格・原価単価の出力要件です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:314`, `:318`, `:322` | 実装方式の断定を削り、「9列フォーマットの出力実装が確認できない」に留める。

- SEVERITY | ①ルート/HTTPメソッド | severity high は「機能丸ごと不在」としては妥当ですが、dimension がルート/HTTPメソッドのままだとhighは過大に見えます。設計はURL未特定で、HTTPメソッド仕様もありません。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:195`, `:208`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` | severityは維持可。ただしdimensionを機能不在に修正する。

確認できた補強根拠:
- 設計は低価格帯20円から300円以下、週間販売/全店在庫によるランク変動、ランク `300,250,200,150,100,80,50,30` を要求しています。根拠: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:259`, `:263`
- 既存の基準価格CSV登録はCSV値とカード状態割引から算出する処理で、低価格帯ランク変動ではありません。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:39`
- CSV import type 定数にも低価格帯相当は確認できず、既存は `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID` などまでです。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28`

VERDICT: false_positive=0, missed=0, weak_evidence=3, 総合=要修正
```


## m05-06_admin_order_order_bulk_manual_mail

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
FALSE_POSITIVE | 対象finding 2件 | 誤検知なし。どちらも設計引用・実装引用は実在し、実装は `getOrderNo()` ではなく `getOrderNumber()` を使用している | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:235`, `:256` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:459`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `:647`, `:887`, `:1768` | findingsは維持

WEAK_EVIDENCE | 対象finding 2件 | 根拠不備なし。JSONの `designRef` / `implRef` は参照可能で、引用内容も概ね該当行と一致 | 同上 | 修正不要

MISSED | 送信履歴 / 操作会員 | 設計の移行先履歴紐付けには `creator_id` が含まれるが、本機能の送信実装は `saveUserMailHistory()` に操作会員を渡さず、既定値 `null` のまま `setCreator($creator)` している。なお設計の送信フロー・副作用節は「テンプレート参照・受注・顧客・ゲストID」までしか明記しておらず、設計内にも粒度差がある | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:221` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092`, `:2107`, `:2115`, `:2122` | findingsへ低〜中程度の差分として追加、または設計側で本機能では `creator_id` 非設定と明記

SEVERITY | 既存2 finding | `med` は妥当。顧客向け本文・確認画面表示に出る番号差分だが、送信不能やDB破壊ではないため `high` までは不要、顧客表示値の相違なので `low` でもない | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:393`, `:394`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:116` | severity維持

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
177,521
FALSE_POSITIVE | 対象finding 2件 | 誤検知なし。どちらも設計引用・実装引用は実在し、実装は `getOrderNo()` ではなく `getOrderNumber()` を使用している | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:235`, `:256` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:459`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `:647`, `:887`, `:1768` | findingsは維持

WEAK_EVIDENCE | 対象finding 2件 | 根拠不備なし。JSONの `designRef` / `implRef` は参照可能で、引用内容も概ね該当行と一致 | 同上 | 修正不要

MISSED | 送信履歴 / 操作会員 | 設計の移行先履歴紐付けには `creator_id` が含まれるが、本機能の送信実装は `saveUserMailHistory()` に操作会員を渡さず、既定値 `null` のまま `setCreator($creator)` している。なお設計の送信フロー・副作用節は「テンプレート参照・受注・顧客・ゲストID」までしか明記しておらず、設計内にも粒度差がある | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:221` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092`, `:2107`, `:2115`, `:2122` | findingsへ低〜中程度の差分として追加、または設計側で本機能では `creator_id` 非設定と明記

SEVERITY | 既存2 finding | `med` は妥当。顧客向け本文・確認画面表示に出る番号差分だが、送信不能やDB破壊ではないため `high` までは不要、顧客表示値の相違なので `low` でもない | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:393`, `:394`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:116` | severity維持

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## m05-07_admin_order_order_labels_csv_export

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
監査結果です。差分候補JSONの1件は、designRef/implRefとも実在し、内容も概ね妥当でした。誤検知・根拠不備・重要度誤りは確認していません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| MISSED | フロント挙動 | 設計書は「画面上のボタン文言」を `admin.order.output_labels_Export` =「送り状出力」としているが、出荷指示編集画面の実装は `admin.stock.move_instruction.csv_download_invoice` =「送り状CSVダウンロード」を使用している。受注一覧側は設計どおりなので、出荷指示編集側だけの低影響な文言差分。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:222`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236` | 設計書に画面別文言を明記するか、出荷指示編集側の翻訳キーを設計に合わせる。 |

確認済み補足: 候補JSONの「確定日時/出荷指示日」差分は有効です。設計は `confirm_date` を確定日時として対応付けていますが、実装のCSVデータ2列目は `getCommitDate()` です。根拠は設計HTML `:230`, `:254`、実装 `OrderRepository.php:709-713`、Entity `Order.php:666-670`, `:1847`, `:2174`、CSVヘッダ `ShippingStandbyCsvExporterService.php:63-67` で確認しました。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
92,580
監査結果です。差分候補JSONの1件は、designRef/implRefとも実在し、内容も概ね妥当でした。誤検知・根拠不備・重要度誤りは確認していません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| MISSED | フロント挙動 | 設計書は「画面上のボタン文言」を `admin.order.output_labels_Export` =「送り状出力」としているが、出荷指示編集画面の実装は `admin.stock.move_instruction.csv_download_invoice` =「送り状CSVダウンロード」を使用している。受注一覧側は設計どおりなので、出荷指示編集側だけの低影響な文言差分。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:222`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236` | 設計書に画面別文言を明記するか、出荷指示編集側の翻訳キーを設計に合わせる。 |

確認済み補足: 候補JSONの「確定日時/出荷指示日」差分は有効です。設計は `confirm_date` を確定日時として対応付けていますが、実装のCSVデータ2列目は `getCommitDate()` です。根拠は設計HTML `:230`, `:254`、実装 `OrderRepository.php:709-713`、Entity `Order.php:666-670`, `:1847`, `:2174`、CSVヘッダ `ShippingStandbyCsvExporterService.php:63-67` で確認しました。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## m05-08_admin_order_order_stack_paper_print

**VERDICT**: 誤検知=1 / 見落とし=0 / 根拠不備=1 / 総合=要修正


```
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | `order_no` vs `order_number` は実装差分ではなく設計書の表記ゆれ。設計書自身が ec-cube-enterprise のDB名を正とし、実装は `dtb_order.order_number` を取得・判定して「注文番号未採番なら400」を実現している。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:221`, `:225`, `:239`, `:269`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326`, `:1349`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:887` | findingはCONFIRMEDではなく「設計書修正候補」に落とす。実装欠陥扱いしない。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | DB操作節の「更新しない」だけを根拠に実装差分とするのは弱い。設計の概要・処理フロー・入出力・DBカラム・トランザクション節は更新を明記しており、実装もそれに一致する。候補JSON自体も「設計内自己矛盾」と書いており、設計vs実装差分としての根拠が的外れ。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:218`, `:239`, `:259`, `:263`, `:265`, `:299`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:49`, `:52`, `:53`, `:56`, `:60`, `:61` | 「設計書内矛盾」として記録し、実装差分findingからは除外または注記付きにする。

MISSED | 全体 | 確認範囲では追加の重要差分は確認不能ではなく、確認できた範囲で見当たらない。入口、AJAX、CSRF、ids、注文番号チェック、オプション分岐、更新、例外、トランザクションは設計記述と概ね一致。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:230`, `:233`, `:237`, `:239`, `:246`, `:253`, `:277`, `:280`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:231`, `:236`, `:237`, `:1249`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:23`, `:24`, `:25`, `:27`, `:28`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:853`, `:865`, `:876`, `:882`, `:887`, `:906` | 追加finding不要。

VERDICT: false_positive=1, missed=0, weak_evidence=1, 総合=要修正
tokens used
118,861
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | `order_no` vs `order_number` は実装差分ではなく設計書の表記ゆれ。設計書自身が ec-cube-enterprise のDB名を正とし、実装は `dtb_order.order_number` を取得・判定して「注文番号未採番なら400」を実現している。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:221`, `:225`, `:239`, `:269`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326`, `:1349`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:887` | findingはCONFIRMEDではなく「設計書修正候補」に落とす。実装欠陥扱いしない。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | DB操作節の「更新しない」だけを根拠に実装差分とするのは弱い。設計の概要・処理フロー・入出力・DBカラム・トランザクション節は更新を明記しており、実装もそれに一致する。候補JSON自体も「設計内自己矛盾」と書いており、設計vs実装差分としての根拠が的外れ。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:218`, `:239`, `:259`, `:263`, `:265`, `:299`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:49`, `:52`, `:53`, `:56`, `:60`, `:61` | 「設計書内矛盾」として記録し、実装差分findingからは除外または注記付きにする。

MISSED | 全体 | 確認範囲では追加の重要差分は確認不能ではなく、確認できた範囲で見当たらない。入口、AJAX、CSRF、ids、注文番号チェック、オプション分岐、更新、例外、トランザクションは設計記述と概ね一致。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:230`, `:233`, `:237`, `:239`, `:246`, `:253`, `:277`, `:280`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:231`, `:236`, `:237`, `:1249`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:23`, `:24`, `:25`, `:27`, `:28`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:853`, `:865`, `:876`, `:882`, `:887`, `:906` | 追加finding不要。

VERDICT: false_positive=1, missed=0, weak_evidence=1, 総合=要修正
```


## m05-09_admin_order_order_print_delivery_slips_ja

**VERDICT**: 誤検知=0 / 見落とし=0 / 根拠不備=0 / 総合=信頼できる


```
確認結果: 候補findingは概ね信頼できます。誤検知・根拠不備・重要度誤りは見つかりませんでした。

CONFIRMED | ④DBカラム・DB操作・テーブル | 設計書は `dtb_order` 代表列として `order_no` を挙げるが、実装の納品書表示値は `order_number`。候補の指摘は妥当。 | 設計: `function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:263`、実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:281`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:42`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`、`:647` | 候補どおり維持。設計書側を `order_number` に補正するのが妥当。

SEVERITY | ④DBカラム・DB操作・テーブル | `low` は妥当。帳票の表示元列名の細部差分で、ルート処理・DB書込・権限・エラー処理の破綻ではない。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743`、`:746` | 重要度変更不要。

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
tokens used
74,440
確認結果: 候補findingは概ね信頼できます。誤検知・根拠不備・重要度誤りは見つかりませんでした。

CONFIRMED | ④DBカラム・DB操作・テーブル | 設計書は `dtb_order` 代表列として `order_no` を挙げるが、実装の納品書表示値は `order_number`。候補の指摘は妥当。 | 設計: `function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:263`、実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:281`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:42`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`、`:647` | 候補どおり維持。設計書側を `order_number` に補正するのが妥当。

SEVERITY | ④DBカラム・DB操作・テーブル | `low` は妥当。帳票の表示元列名の細部差分で、ルート処理・DB書込・権限・エラー処理の破綻ではない。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743`、`:746` | 重要度変更不要。

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
```


## m05-11_admin_order_order_edit

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ② 業務ルール・計算 / DB操作 | 登録経路で「出荷完了」へ変更した場合、設計は未出荷の配送に出荷日時を立てるのみだが、実装も登録経路では `Shipping` だけを更新し、受注本体 `Order.shipping_date` は更新しない。一方、`status_change` 経路は受注本体と全配送の両方を更新する。findingsに未記載。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244` は登録経路で「未出荷の配送に出荷日時」。同 `:246` はstatus_changeで「受注および全配送」。実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:623-628` は登録経路で `Shipping->setShippingDate()` のみ、`:775-779` はstatus_changeで `TargetOrder->setShippingDate()` と `Shipping->setShippingDate()`。 | 登録経路で受注本体出荷日を更新しないことを仕様差分として追加する。業務上、一覧・検索・帳票が `dtb_order.shipping_date` を見るなら重要度はmed以上。
SEVERITY | ② 業務ルール・計算（ポイント） | キャンセル時の `cancelOrderPoints()` 追加挙動は会員ポイント残高に直接影響するため、候補のmedは妥当からやや低め。少なくともlowではない。 | 実装: `EditController.php:636-637`, `:815-816`。設計: HTML `:244`, `:246` は出荷完了時の `gainPoints` のみで取消ポイント処理は未記載。 | med維持、またはポイント残高を正とする業務影響としてhighへ引き上げ検討。
SEVERITY | ② 業務ルール・計算（ポイント再計算の例外） | キャンセル時に獲得ポイントを0固定する差分は、確定ポイント値と会員残高取消処理に絡むためlowは軽すぎる可能性がある。 | 実装: `EditController.php:955-962`。設計: HTML `:258` は支払方法名・小計・割合変化による再計算条件のみ。 | medへ引き上げを推奨。

FALSE_POSITIVEは確認されませんでした。各findingのdesignRef/implRefはいずれも実在し、引用の主要部も確認できました。WEAK_EVIDENCEも確認されませんでした。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
80,135
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ② 業務ルール・計算 / DB操作 | 登録経路で「出荷完了」へ変更した場合、設計は未出荷の配送に出荷日時を立てるのみだが、実装も登録経路では `Shipping` だけを更新し、受注本体 `Order.shipping_date` は更新しない。一方、`status_change` 経路は受注本体と全配送の両方を更新する。findingsに未記載。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244` は登録経路で「未出荷の配送に出荷日時」。同 `:246` はstatus_changeで「受注および全配送」。実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:623-628` は登録経路で `Shipping->setShippingDate()` のみ、`:775-779` はstatus_changeで `TargetOrder->setShippingDate()` と `Shipping->setShippingDate()`。 | 登録経路で受注本体出荷日を更新しないことを仕様差分として追加する。業務上、一覧・検索・帳票が `dtb_order.shipping_date` を見るなら重要度はmed以上。
SEVERITY | ② 業務ルール・計算（ポイント） | キャンセル時の `cancelOrderPoints()` 追加挙動は会員ポイント残高に直接影響するため、候補のmedは妥当からやや低め。少なくともlowではない。 | 実装: `EditController.php:636-637`, `:815-816`。設計: HTML `:244`, `:246` は出荷完了時の `gainPoints` のみで取消ポイント処理は未記載。 | med維持、またはポイント残高を正とする業務影響としてhighへ引き上げ検討。
SEVERITY | ② 業務ルール・計算（ポイント再計算の例外） | キャンセル時に獲得ポイントを0固定する差分は、確定ポイント値と会員残高取消処理に絡むためlowは軽すぎる可能性がある。 | 実装: `EditController.php:955-962`。設計: HTML `:258` は支払方法名・小計・割合変化による再計算条件のみ。 | medへ引き上げを推奨。

FALSE_POSITIVEは確認されませんでした。各findingのdesignRef/implRefはいずれも実在し、引用の主要部も確認できました。WEAK_EVIDENCEも確認されませんでした。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## m05-13_admin_order_order_tracking_number

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
候補finding（空文字が非同期保存で消去として成立する件）は確認済みで、誤検知ではありません。設計RefもMarkdown/HTML双方で実在し、実装Refも妥当です。重要度 `med` も、管理画面内で既存送り状No.を空にできる業務影響として概ね妥当です。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | エラー処理/フロント失敗応答 | 設計はHTTPエラー応答時に `messages` 配列を改行連結してアラート表示するとするが、実装のXHR/CSRF不正400と保存例外500は `messages` を返さない。JS側は常に `response.messages.length` を参照するため、この経路では設計どおりのアラート表示にならない可能性がある。 | [m05-13_admin_order_order_tracking_number.html](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html:242), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:568), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:605), [index.twig](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:219) | findingsに追加。実装を直すなら400/500でも `messages` を返すか、JS側で `messages` 不在時のフォールバック表示を行う。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
63,186
候補finding（空文字が非同期保存で消去として成立する件）は確認済みで、誤検知ではありません。設計RefもMarkdown/HTML双方で実在し、実装Refも妥当です。重要度 `med` も、管理画面内で既存送り状No.を空にできる業務影響として概ね妥当です。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | エラー処理/フロント失敗応答 | 設計はHTTPエラー応答時に `messages` 配列を改行連結してアラート表示するとするが、実装のXHR/CSRF不正400と保存例外500は `messages` を返さない。JS側は常に `response.messages.length` を参照するため、この経路では設計どおりのアラート表示にならない可能性がある。 | [m05-13_admin_order_order_tracking_number.html](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html:242), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:568), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:605), [index.twig](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:219) | findingsに追加。実装を直すなら400/500でも `messages` を返すか、JS側で `messages` 不在時のフォールバック表示を行う。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## m05-14_admin_order_order_status_change

**VERDICT**: 誤検知=0 / 見落とし=2 / 根拠不備=1 / 総合=要修正


```
FALSE_POSITIVE | なし | 候補1・2とも、参照先自体に実装差分の根は存在するため誤検知とは判断しない | - | -

MISSED | ⑦エラー処理・試行制限 | 許可されない遷移先を強制送信した場合、設計は「受注編集画面を再表示し、ステータス変更不可エラーを表示」とするが、実装は `OrderType` でフォームエラーを付けた後、`tryCommitOrderStatusChange()` の `!$form->isValid()` でリダイレクトするため、インラインエラー表示が失われる可能性が高い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:150-151`, `:292`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:523-531`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:768-769` | findingsへ追加。リダイレクトではなく再表示、またはフラッシュ等でエラーを保持する差分として扱う。

MISSED | ⑤画面表示・メッセージ | 設計は `admin.order.cancel.complete` に英語ロケール資源がないとして英語表示を `-` とするが、実装には英語文言 `Order cancellation completed.` が存在する | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:142-144`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2361` | 設計またはfindingに反映。重要度はlow相当。

SEVERITY | ⑦エラー処理・試行制限 | 候補2のlow/UNCERTAIN扱いは過小。設計は「購入処理上の例外」はエラーメッセージ表示・画面再表示を要求しているが、status_change確定処理は `wrapInTransaction()` 周辺に `PurchaseException` / `ShoppingException` / `InvalidArgumentException` のcatchがない。`OrderStateMachine` の購読処理は在庫・ポイント処理で `PurchaseException` を投げ得るため、通常の許可遷移でも500化し得る | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-824`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:690-708`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:121-128`, `:143-149` | 候補2はmed以上でCONFIRMED寄りに修正。register側と同等のcatch有無を差分根拠にする。

WEAK_EVIDENCE | ⑦エラー処理・試行制限 | 候補2は `md:302` の「不許可遷移時rollback」だけを主根拠にしており、より直接の設計根拠である `md:304` の「購入処理上の例外」を使っていない。また「実務上到達不能」とするが、PurchaseException系はステートマシン購読処理から到達し得るため根拠が弱い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:302-304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:123-128`, `:145-149` | designRefと説明を修正し、到達不能という断定を削除する。

VERDICT: false_positive=0, missed=2, weak_evidence=1, 総合=要修正
tokens used
149,158
FALSE_POSITIVE | なし | 候補1・2とも、参照先自体に実装差分の根は存在するため誤検知とは判断しない | - | -

MISSED | ⑦エラー処理・試行制限 | 許可されない遷移先を強制送信した場合、設計は「受注編集画面を再表示し、ステータス変更不可エラーを表示」とするが、実装は `OrderType` でフォームエラーを付けた後、`tryCommitOrderStatusChange()` の `!$form->isValid()` でリダイレクトするため、インラインエラー表示が失われる可能性が高い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:150-151`, `:292`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:523-531`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:768-769` | findingsへ追加。リダイレクトではなく再表示、またはフラッシュ等でエラーを保持する差分として扱う。

MISSED | ⑤画面表示・メッセージ | 設計は `admin.order.cancel.complete` に英語ロケール資源がないとして英語表示を `-` とするが、実装には英語文言 `Order cancellation completed.` が存在する | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:142-144`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2361` | 設計またはfindingに反映。重要度はlow相当。

SEVERITY | ⑦エラー処理・試行制限 | 候補2のlow/UNCERTAIN扱いは過小。設計は「購入処理上の例外」はエラーメッセージ表示・画面再表示を要求しているが、status_change確定処理は `wrapInTransaction()` 周辺に `PurchaseException` / `ShoppingException` / `InvalidArgumentException` のcatchがない。`OrderStateMachine` の購読処理は在庫・ポイント処理で `PurchaseException` を投げ得るため、通常の許可遷移でも500化し得る | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-824`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:690-708`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:121-128`, `:143-149` | 候補2はmed以上でCONFIRMED寄りに修正。register側と同等のcatch有無を差分根拠にする。

WEAK_EVIDENCE | ⑦エラー処理・試行制限 | 候補2は `md:302` の「不許可遷移時rollback」だけを主根拠にしており、より直接の設計根拠である `md:304` の「購入処理上の例外」を使っていない。また「実務上到達不能」とするが、PurchaseException系はステートマシン購読処理から到達し得るため根拠が弱い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:302-304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:123-128`, `:145-149` | designRefと説明を修正し、到達不能という断定を削除する。

VERDICT: false_positive=0, missed=2, weak_evidence=1, 総合=要修正
```


## m05-17_admin_order_order_shipping_memo

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=1 / 総合=要修正


```
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
WEAK_EVIDENCE | ④DBカラム・DB操作 | finding 3 は「未描画noteがnull化される」と因果まで述べているが、実行検証なしでは確認不能。コード上は `Shipping` サブフォーム追加、`note` フィールド定義、未描画、persist/flush までは確認できるが、Symfony compound form の `mapped=false` 子フォームで未送信子が実体へnull反映されるかはこの監査だけでは断定不可。 | JSON:36-39、OrderType.php:456-460、ShippingType.php:207-212、edit.twig:1626-1768、EditController.php:656-659 | 「消去される恐れ」または「要実行検証」に留める。実際のPOST再現テストで `dtb_shipping.note` の保持/消去を確認してからCONFIRMED化する。
MISSED | 利用者視点の入口/処理フロー（受注新規登録画面） | findings は既存の単一配送受注編集を主対象にしているが、設計は `GET/POST /order/new` でも出荷情報ブロックに空の出荷用メモ欄を表示・保存すると明記。実装は新規/編集とも同じ `edit.twig` を使い、同テンプレートに `form.Shipping.note` 描画が無いため、新規受注でも設計差分が発生する。 | 設計HTML:241、設計HTML:260、EditController.php:146-149、edit.twig:1579-1776、ShippingType.php:207-212 | finding 1 または別findingに「受注新規登録画面でも表示・入力・保存不能」を明記する。
SEVERITY | ②業務ルール・計算 | finding 1 の `med` は低め。設計上は受注編集/新規登録から出荷用メモを閲覧・編集・保存する入口そのものが欠落しており、入力値の保存経路・初期表示・バリデーション表示までまとめて不達になる。 | 設計HTML:241、設計HTML:248-251、edit.twig:1579-1776、OrderType.php:456-460、ShippingType.php:207-212 | `high` への引き上げを推奨。
SEVERITY | ③バリデーション/フロント挙動 | finding 2 はツールチップ欠落だけなら `low` 妥当。ただし「出荷編集画面にもツールチップがない」まで含めるなら、受注編集欄欠落とは別に全画面で補助説明が未実装というUI仕様差分として整理するべき。 | 設計HTML:244-245、shipping.twig:685-690、messages.ja.yaml:3572、rg結果で `tooltip.order.shipping_info.shop_memo` 参照はロケール定義のみ | finding 2 は `low` 維持で可。主差分の「欄が無い」はfinding 1へ寄せ、ツールチップ欠落は独立して扱う。

確認結果として、finding 1 は実装側に `form.Shipping.note` 描画がなく、出荷編集画面にだけ `shippingForm.note` があるため誤検知ではありません。finding 2 もロケール定義はあるがテンプレート参照がなく、出荷編集画面のラベルもプレーンなので誤検知ではありません。CSV/DB列については `dtb_csv.csv` に csv_type 3/4 の `Eccube\Entity\Shipping.note`「配達用メモ」があり、`Shipping.php` でも `note` 列は確認できるため、ここに追加差分は見つけていません。

VERDICT: false_positive=0, missed=1, weak_evidence=1, 総合=要修正
tokens used
92,540
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
WEAK_EVIDENCE | ④DBカラム・DB操作 | finding 3 は「未描画noteがnull化される」と因果まで述べているが、実行検証なしでは確認不能。コード上は `Shipping` サブフォーム追加、`note` フィールド定義、未描画、persist/flush までは確認できるが、Symfony compound form の `mapped=false` 子フォームで未送信子が実体へnull反映されるかはこの監査だけでは断定不可。 | JSON:36-39、OrderType.php:456-460、ShippingType.php:207-212、edit.twig:1626-1768、EditController.php:656-659 | 「消去される恐れ」または「要実行検証」に留める。実際のPOST再現テストで `dtb_shipping.note` の保持/消去を確認してからCONFIRMED化する。
MISSED | 利用者視点の入口/処理フロー（受注新規登録画面） | findings は既存の単一配送受注編集を主対象にしているが、設計は `GET/POST /order/new` でも出荷情報ブロックに空の出荷用メモ欄を表示・保存すると明記。実装は新規/編集とも同じ `edit.twig` を使い、同テンプレートに `form.Shipping.note` 描画が無いため、新規受注でも設計差分が発生する。 | 設計HTML:241、設計HTML:260、EditController.php:146-149、edit.twig:1579-1776、ShippingType.php:207-212 | finding 1 または別findingに「受注新規登録画面でも表示・入力・保存不能」を明記する。
SEVERITY | ②業務ルール・計算 | finding 1 の `med` は低め。設計上は受注編集/新規登録から出荷用メモを閲覧・編集・保存する入口そのものが欠落しており、入力値の保存経路・初期表示・バリデーション表示までまとめて不達になる。 | 設計HTML:241、設計HTML:248-251、edit.twig:1579-1776、OrderType.php:456-460、ShippingType.php:207-212 | `high` への引き上げを推奨。
SEVERITY | ③バリデーション/フロント挙動 | finding 2 はツールチップ欠落だけなら `low` 妥当。ただし「出荷編集画面にもツールチップがない」まで含めるなら、受注編集欄欠落とは別に全画面で補助説明が未実装というUI仕様差分として整理するべき。 | 設計HTML:244-245、shipping.twig:685-690、messages.ja.yaml:3572、rg結果で `tooltip.order.shipping_info.shop_memo` 参照はロケール定義のみ | finding 2 は `low` 維持で可。主差分の「欄が無い」はfinding 1へ寄せ、ツールチップ欠落は独立して扱う。

確認結果として、finding 1 は実装側に `form.Shipping.note` 描画がなく、出荷編集画面にだけ `shippingForm.note` があるため誤検知ではありません。finding 2 もロケール定義はあるがテンプレート参照がなく、出荷編集画面のラベルもプレーンなので誤検知ではありません。CSV/DB列については `dtb_csv.csv` に csv_type 3/4 の `Eccube\Entity\Shipping.note`「配達用メモ」があり、`Shipping.php` でも `note` 列は確認できるため、ここに追加差分は見つけていません。

VERDICT: false_positive=0, missed=1, weak_evidence=1, 総合=要修正
```


## m05-18_admin_order_order_shipping_standby_list_create

**VERDICT**: 誤検知=0 / 見落とし=0 / 根拠不備=0 / 総合=要修正


```
監査結果: 差分候補1件は妥当です。設計参照・実装参照はいずれも実在し、別ルートで `order_no` 条件を実装している箇所も確認できませんでした。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの `med` は過小評価の可能性があります。設計は注文番号レンジを `dtb_order.order_no` に掛けると明記している一方、実装は `o.order_number` に掛けています。この条件は抽出後にリスト作成と受注ステータス・出荷指示日の一括更新へ直結するため、レンジ指定時に誤った受注を更新し得ます。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:252`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179`, 更新処理: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:55`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1235` | 重要度を `high` に上げることを推奨

FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | 誤検知ではありません。対象リポジトリ全体で `order_id_from` / `order_id_to` は `OrderRepository::getOrdersForStandby()` の `o.order_number` 条件のみ確認でき、設計どおり `o.order_no` へ掛ける別実装は確認できません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179` | 候補findingは維持

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | 根拠不備はありません。設計HTMLの該当行は `order_no` 条件を記載し、実装行は `order_number` 条件を記載しています。両カラムも別プロパティとして存在します。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:242`, `:252`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647` | 対応不要

MISSED | - | 追加の見落とし差分は確認できませんでした。処理フロー、フォーム検証、日付条件、区分判定順序、永続化、例外処理、セッション非保存は設計記述と概ね一致します。 | 例: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:792`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:32`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1063`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1200` | 追加finding不要

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=要修正
tokens used
119,389
監査結果: 差分候補1件は妥当です。設計参照・実装参照はいずれも実在し、別ルートで `order_no` 条件を実装している箇所も確認できませんでした。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの `med` は過小評価の可能性があります。設計は注文番号レンジを `dtb_order.order_no` に掛けると明記している一方、実装は `o.order_number` に掛けています。この条件は抽出後にリスト作成と受注ステータス・出荷指示日の一括更新へ直結するため、レンジ指定時に誤った受注を更新し得ます。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:252`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179`, 更新処理: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:55`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1235` | 重要度を `high` に上げることを推奨

FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | 誤検知ではありません。対象リポジトリ全体で `order_id_from` / `order_id_to` は `OrderRepository::getOrdersForStandby()` の `o.order_number` 条件のみ確認でき、設計どおり `o.order_no` へ掛ける別実装は確認できません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179` | 候補findingは維持

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | 根拠不備はありません。設計HTMLの該当行は `order_no` 条件を記載し、実装行は `order_number` 条件を記載しています。両カラムも別プロパティとして存在します。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:242`, `:252`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647` | 対応不要

MISSED | - | 追加の見落とし差分は確認できませんでした。処理フロー、フォーム検証、日付条件、区分判定順序、永続化、例外処理、セッション非保存は設計記述と概ね一致します。 | 例: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:792`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:32`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1063`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1200` | 追加finding不要

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=要修正
```


## m05-19_admin_order_order_shipping_standby_list_search

**VERDICT**: 誤検知=0 / 見落とし=0 / 根拠不備=1 / 総合=要修正


```
FALSE_POSITIVE: なし。3件とも designRef/implRef は実在し、設計記述と実装差分は確認できました。

SEVERITY | ①ルート/パス | 表示件数 option value の差分は `med` ではなく `low` 相当。実装は `/standby/page/1?page_count=...` だが同じ `index()` に到達し、表示件数は `page_count` クエリで処理されるため、確認できる業務影響はURL形式差に留まる | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:93` | findingは残し、severityをlowへ下げる

WEAK_EVIDENCE | ⑤画面遷移・引き継ぎ状態 | 3件目のevidenceにある「翻訳文言を再検証済み」は、JSON単体では根拠ファイルが implRef に含まれていない。差分自体は正しいが、翻訳キーの実文言まで主張するなら locale ファイルを implRef/evidence に明示すべき | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:317`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1689`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1690` | implRefに `messages.ja.yaml:1688-1690` を追加する

MISSED: なし。処理フロー、検索条件、判定順序、バリデーション、セッション保存は主要実装と概ね一致していました | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:238`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:240`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:246`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:127`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:148`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:67` | 追加不要

VERDICT: false_positive=0, missed=0, weak_evidence=1, 総合=要修正
tokens used
99,851
FALSE_POSITIVE: なし。3件とも designRef/implRef は実在し、設計記述と実装差分は確認できました。

SEVERITY | ①ルート/パス | 表示件数 option value の差分は `med` ではなく `low` 相当。実装は `/standby/page/1?page_count=...` だが同じ `index()` に到達し、表示件数は `page_count` クエリで処理されるため、確認できる業務影響はURL形式差に留まる | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:93` | findingは残し、severityをlowへ下げる

WEAK_EVIDENCE | ⑤画面遷移・引き継ぎ状態 | 3件目のevidenceにある「翻訳文言を再検証済み」は、JSON単体では根拠ファイルが implRef に含まれていない。差分自体は正しいが、翻訳キーの実文言まで主張するなら locale ファイルを implRef/evidence に明示すべき | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:317`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1689`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1690` | implRefに `messages.ja.yaml:1688-1690` を追加する

MISSED: なし。処理フロー、検索条件、判定順序、バリデーション、セッション保存は主要実装と概ね一致していました | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:238`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:240`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:246`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:127`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:148`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:67` | 追加不要

VERDICT: false_positive=0, missed=0, weak_evidence=1, 総合=要修正
```


## m05-21_admin_order_order_shipping_standby_picking_list_print

**VERDICT**: 誤検知=0 / 見落とし=0 / 根拠不備=0 / 総合=信頼できる


```
監査結果: 候補2件はいずれも実ファイルで根拠を確認でき、誤検知・根拠不備は見つかりませんでした。追加で設計HTML後半、Twig、JS、CSS、関連ルート検索も確認しましたが、findingsに載せるべき明確な見落としは確認できません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| FALSE_POSITIVE | ② 業務ルール・計算 | なし。設計はカテゴリIDでgoods判定、実装は`getSubInfosByProductClassIds`の有無で判定しており、候補どおり差分あり。実データ上の発生有無は確認不能だが、コード上の判定基準差は確認済み。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:246`、実装 `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343`、`src/Eccube/Repository/ProductClassRepository.php:3042`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:168` | 候補維持 |
| FALSE_POSITIVE | ④ DBカラム・DB操作 / ⑦ エラー処理 | なし。設計は閾値2件を一括取得して添字`[0]`/`[1]`利用、実装は個別`findOneBy`かつ欠落時0なので、候補どおり差分あり。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:240`、`同:277`、実装 `src/Eccube/Repository/DtbShippingStandbyRepository.php:143`、`同:214` | 候補維持 |
| WEAK_EVIDENCE | 全体 | なし。候補のdesignRef/implRefはいずれも存在し、引用内容も周辺コード・設計節と整合。 | 上記各行、および `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:348`、`同:375` | 対応不要 |
| MISSED | 全体 | なし。フロント挙動、印刷Twig、CSS、セッション、権限、404、入力扱いは設計と大きな差分なし。 | `src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12`、`同:113`、`src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:1`、`html/template/admin/assets/js/function.js:210`、`html/template/admin/assets/css/pickinglist.css:15` | 対応不要 |
| SEVERITY | 全体 | 重要度誤りなし。goods分類差は出力ブロックと点数集計に直結するためhighは妥当。閾値取得差は異常系・設定依存の挙動差なのでlowは妥当。 | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:373`、`同:379`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:143` | 候補維持 |

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
tokens used
71,975
監査結果: 候補2件はいずれも実ファイルで根拠を確認でき、誤検知・根拠不備は見つかりませんでした。追加で設計HTML後半、Twig、JS、CSS、関連ルート検索も確認しましたが、findingsに載せるべき明確な見落としは確認できません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| FALSE_POSITIVE | ② 業務ルール・計算 | なし。設計はカテゴリIDでgoods判定、実装は`getSubInfosByProductClassIds`の有無で判定しており、候補どおり差分あり。実データ上の発生有無は確認不能だが、コード上の判定基準差は確認済み。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:246`、実装 `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343`、`src/Eccube/Repository/ProductClassRepository.php:3042`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:168` | 候補維持 |
| FALSE_POSITIVE | ④ DBカラム・DB操作 / ⑦ エラー処理 | なし。設計は閾値2件を一括取得して添字`[0]`/`[1]`利用、実装は個別`findOneBy`かつ欠落時0なので、候補どおり差分あり。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:240`、`同:277`、実装 `src/Eccube/Repository/DtbShippingStandbyRepository.php:143`、`同:214` | 候補維持 |
| WEAK_EVIDENCE | 全体 | なし。候補のdesignRef/implRefはいずれも存在し、引用内容も周辺コード・設計節と整合。 | 上記各行、および `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:348`、`同:375` | 対応不要 |
| MISSED | 全体 | なし。フロント挙動、印刷Twig、CSS、セッション、権限、404、入力扱いは設計と大きな差分なし。 | `src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12`、`同:113`、`src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:1`、`html/template/admin/assets/js/function.js:210`、`html/template/admin/assets/css/pickinglist.css:15` | 対応不要 |
| SEVERITY | 全体 | 重要度誤りなし。goods分類差は出力ブロックと点数集計に直結するためhighは妥当。閾値取得差は異常系・設定依存の挙動差なのでlowは妥当。 | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:373`、`同:379`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:143` | 候補維持 |

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
```


## m05-24_admin_order_order_shipping_export_for_import

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | なし。候補findingは成立。設計は「注文の郵便番号」を `dtb_order.postal_code` とする一方、実装の当該CSV生成は `c.postal_code` と `s.postal_code` を `SUBSTRING` しており、`generateResultCsv` 内で `o.postal_code` は参照していない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:224-225`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1386-1387`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1427-1428` | 候補findingは維持。設計側の「注文の郵便番号」表現を顧客/配送先の実データ源に合わせて修正。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | なし。designRef/implRef は実在し、引用内容も概ね確認できる。補強するなら `dtb_order.postal_code` 自体は存在するが、このCSV生成では未使用である点を明記するとよい。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:488`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373` | 根拠補強のみ。

MISSED | バリデーション/処理フロー | 設計は「キー一覧を整数IDの並びとして解釈」とするが、実装は `array_keys($rawOrderIds)` をそのまま渡しており、整数キャスト・整数型検証はない。DQL側も `o IN (:orders)` にそのまま設定している。実行時に数値文字列が許容されるかは確認不能だが、少なくとも設計上の「整数ID」化は実装されていない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:236`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:202-213`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1460-1461` | findingsへ low 程度で追加、または設計を「配列キーをIDとして渡す」に修正。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの low は妥当。設計内部でも業務ルール節は「顧客郵便番号」を `SUBSTRING` 分割と書いており、主な不整合は移行表のデータ源ラベルに限定される。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:225`, `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:243` | severity 変更不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
72,314
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | なし。候補findingは成立。設計は「注文の郵便番号」を `dtb_order.postal_code` とする一方、実装の当該CSV生成は `c.postal_code` と `s.postal_code` を `SUBSTRING` しており、`generateResultCsv` 内で `o.postal_code` は参照していない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:224-225`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1386-1387`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1427-1428` | 候補findingは維持。設計側の「注文の郵便番号」表現を顧客/配送先の実データ源に合わせて修正。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | なし。designRef/implRef は実在し、引用内容も概ね確認できる。補強するなら `dtb_order.postal_code` 自体は存在するが、このCSV生成では未使用である点を明記するとよい。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:488`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373` | 根拠補強のみ。

MISSED | バリデーション/処理フロー | 設計は「キー一覧を整数IDの並びとして解釈」とするが、実装は `array_keys($rawOrderIds)` をそのまま渡しており、整数キャスト・整数型検証はない。DQL側も `o IN (:orders)` にそのまま設定している。実行時に数値文字列が許容されるかは確認不能だが、少なくとも設計上の「整数ID」化は実装されていない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:236`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:202-213`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1460-1461` | findingsへ low 程度で追加、または設計を「配列キーをIDとして渡す」に修正。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの low は妥当。設計内部でも業務ルール節は「顧客郵便番号」を `SUBSTRING` 分割と書いており、主な不整合は移行表のデータ源ラベルに限定される。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:225`, `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:243` | severity 変更不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```


## m05-26_admin_order_order_shipping_result_csv_import

**VERDICT**: 誤検知=0 / 見落とし=1 / 根拠不備=0 / 総合=要修正


```
監査結果です。候補6件は、参照行の実在性と主要な差分内容はいずれも確認できました。誤検知・根拠不備は見つかりません。

MISSED | ③バリデーション/②業務ルール | 注文番号の突合方法差分がfindingsに無い。設計は `sprintf` で桁埋めされた注文番号でサブ注文情報を検索すると規定するが、実装はCSV値をそのまま `order_number` に `findOneBy` しており、桁埋めもサブ注文検索もない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:69`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:98`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:112` | 差分として追加。入力CSVの注文番号フォーマット互換に影響するため med 相当。

SEVERITY | ①ルート/HTTPメソッド | POSTパス差分は確認できるが、画面テンプレートは `admin_shipping_result_csv_import` へPOSTし、実装側も同じ `/import` パスをPOSTで受けるため、画面操作上は成立する。外部URL契約の差分としては妥当だが、業務影響は med より low 寄り。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:228-229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:240-265`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45` | severityを low に下げる検討。

SEVERITY | ⑧バッチ/API入出力・再実行性 | 成功後の出荷完了メール送信欠落は候補の指摘どおり確認できる。ポイント処理のトランザクション内実行も確認済み。顧客通知が設計上の成功時出力に含まれるため、medでは過小評価の可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:75`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:129`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:313-327`、同controller内に `MailService` 参照なし | severityを high に上げる検討。

FALSE_POSITIVE | 全体 | なし。 | 確認不能ではなく、候補6件の主要根拠は実在確認済み。 | 対応不要。

WEAK_EVIDENCE | 全体 | なし。 | designRefのMarkdown行、implRefの実装行はいずれも実在。 | 対応不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
79,199
監査結果です。候補6件は、参照行の実在性と主要な差分内容はいずれも確認できました。誤検知・根拠不備は見つかりません。

MISSED | ③バリデーション/②業務ルール | 注文番号の突合方法差分がfindingsに無い。設計は `sprintf` で桁埋めされた注文番号でサブ注文情報を検索すると規定するが、実装はCSV値をそのまま `order_number` に `findOneBy` しており、桁埋めもサブ注文検索もない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:69`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:98`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:112` | 差分として追加。入力CSVの注文番号フォーマット互換に影響するため med 相当。

SEVERITY | ①ルート/HTTPメソッド | POSTパス差分は確認できるが、画面テンプレートは `admin_shipping_result_csv_import` へPOSTし、実装側も同じ `/import` パスをPOSTで受けるため、画面操作上は成立する。外部URL契約の差分としては妥当だが、業務影響は med より low 寄り。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:228-229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:240-265`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45` | severityを low に下げる検討。

SEVERITY | ⑧バッチ/API入出力・再実行性 | 成功後の出荷完了メール送信欠落は候補の指摘どおり確認できる。ポイント処理のトランザクション内実行も確認済み。顧客通知が設計上の成功時出力に含まれるため、medでは過小評価の可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:75`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:129`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:313-327`、同controller内に `MailService` 参照なし | severityを high に上げる検討。

FALSE_POSITIVE | 全体 | なし。 | 確認不能ではなく、候補6件の主要根拠は実在確認済み。 | 対応不要。

WEAK_EVIDENCE | 全体 | なし。 | designRefのMarkdown行、implRefの実装行はいずれも実在。 | 対応不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
```
