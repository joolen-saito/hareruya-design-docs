# メッセージ棚卸し 網羅性レビュー（codex, 2026-07-26）

## 結論
現行パイプラインは4クラス（flash/フォーム制約/JS(alert・confirm・data-*)/twig `|trans`直描画）を網羅的に収録。**twig `|trans` はフロント・管理画面とも是正済み**（残1: `front.product.out_of_stock`）。
ただし codex が**上記4クラスで捕捉できないメッセージ源**を複数検出。網羅=未達。

## codex 検出の未収録クラス（実在確認済み）

### [high] PHP_JSON_response_literal
- 例: `src/Eccube/Controller/Admin/Stock/StockSplitController.php:604 "CSRFトークンが無効です。"`
- flash/constraint/JS/twig-trans のいずれにも該当しないAjax JSONエラー。TSVにも当該文言なし。604,609,613行に別文言もある。

### [high] exception_message_exposed_to_UI
- 例: `src/Eccube/EventListener/RestrictFileUploadListener.php:41 exception.error_message_restrict_url（「この機能は管理者によって制限されています。」）`
- AccessDeniedHttpExceptionのmessageをExceptionListener.php:159-160がそのままerror.twigへ渡す。例外発生源を棚卸し対象にしない限り漏れる。

### [high] exception_message_exposed_to_JSON
- 例: `src/Eccube/Service/Admin/Entry/EntryStatusBulkUpdateAction.php:40 admin.event.entry.bulk_update.invalid_selection`
- throwした翻訳済みInvalidArgumentExceptionをEntryController.php:340-341がgetMessage()のままJSON返却する。JSON消費UIに表示される経路で、(a)-(d)だけでは捕捉不能。

### [high] twig_hardcoded_visible_text
- 例: `src/Eccube/Resource/template/admin/Analysis/product_request.twig:130 "商品ID"`
- |transなしの管理画面表ヘッダ。130-134および154「検索条件に該当するデータがありませんでした。」も同種で、TSVに該当文言なし。

### [high] twig_hardcoded_visible_text
- 例: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:150 "合計"`
- |transなし。167,173,175,188,194,196の「合計」「平均」「今月合計」も表示される。Chart.jsの軸title「日」も72行で直接指定。

### [med] form_configuration_literal_label
- 例: `src/Eccube/Form/Type/Front/IdentificationImageType.php:54 "本人写真と身分証の画像が、撮影された最新の画像であることに同意します。"`
- form_label/form_widget経由で表示されるが、制約メッセージでもtwigの|trans直接描画でもない。フォームlabel/placeholder/help/choiceを独立走査する必要がある。

### [high] app_user_data_hardcoded_visible_text
- 例: `app/template/user_data/hareruya_faq.twig:1304 "FAQを確認しても解決しなかった場合は、こちらからお問い合わせください。"`
- app/配下0件判断は、未収録「キー」だけを見た結論なら不十分。title属性を含む大量の直接表示文言があり、同ファイル:1172等にもユーザー可読title/textがある。


---

## エラー系クラスの追加収録（2026-07-26 完了）
codex検出のうち「エラー系」を追加収録（ユーザー承認範囲）。純ラベル/見出し/app FAQ本文は除外。

**パイプライン**: `extract_error_messages.py`(PHP例外/JsonResponse直書き/twigハードコード決定的抽出) →
`codex_error_msg_driver.py`(message/content/label/**not_shown**判定＋機能割当) → `merge_error_msgs.py`(クラス別に正確な根拠) →
`codex_twig_review_driver.py`(批判レビュー) → `embed_front_msgs_doc.py --area-re '[MFA]\d'`。

**実績**: 候補144 → codex判定(message55/not_shown47/content36/label4) → **55件収録**（機能割当48/EE-ERROR未確定7）。
- レビュー是正: wrong_fid 4（EE-ERROR→A06-03/A06-05/M12-05）・wrong_meta 4（M09-02インライン化・F04-04在庫無制限除外）。
- **レビュー基準の重大な学び**: 当初のレビュープロンプトは fabrication を「yaml非在」で判定していたため、
  **ハードコード直リテラル(ソースに逐語実在)を32件も誤って fabrication 判定**（偽陽性）。決定的再検証で
  **55件全てが根拠ソース(.php/.twig/.en.twig)またはyamlに逐語実在＝捏造ゼロ**を確認。en 5件(F08-03)は
  `.en.twig` 兄弟ファイルに逐語実在。→ `codex_twig_review_driver.py` の fabrication 基準を「yamlまたは根拠ソースに逐語」へ修正済み。

**設計書反映**: 22機能に52件埋込（API 11機能は表示メッセージ節新設）＋HTML22件再生成。doc↔正本 逐語照合 不一致0。
**最終**: 正本1516行 / MESSAGE_LIST 1245件・193機能 / validate 非在0 PASS。
