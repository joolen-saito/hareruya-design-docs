# 実装乖離監査 — 0201_基本設計仕様書(システム設定).html

- 正本: `excel_to_html/output/0201_基本設計仕様書(システム設定).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **316要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④実装実態が同一の指摘は重複とみなし代表1件だけを載せる（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 6 | ○ |
| 実装違い | 実装はあるが設計と違う | 8 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 1 | — |
| 設計どおり | 設計どおり実装されている | 175 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 126 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **316** | |

## 不具合 7件（P1 1 / P2 3 / P3 3）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 4件は重複として代表へ折り畳んだ（判定そのものは 11件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-5-R018 | 権限管理 | 未実装 | ふるまい | P1 | 権限URLマスタに機能を追加した直後は、どの権限からもアクセス不可であること。 |
| sheet-4-R055 | メンバー管理 | 実装違い | IO | P2 | 権限グループの選択肢に、登録されている全権限を出すこと。 |
| sheet-4-R070 | メンバー管理 | 未実装 | ふるまい | P2 | スマレジ用アカウントを有効にできるメンバーは同時に1人までとし、他に有効なメンバーが居る状態で有効化したときはエラーを表示して編集画面へ戻り、スマレジ用アカウントを変更しないこと。 |
| sheet-6-R012 | 権限制御 | 実装違い | ふるまい | P2 | 在庫管理・受注管理・店頭買取管理・イベント管理以外の機能では、編集可能店舗による制限をかけず、アクセスできるメンバーはそのまま編集できること。 |
| sheet-3-R050 | メンバー管理一覧 | 実装違い | ふるまい | P3 | 削除で対象メンバーが存在しないときは、削除警告を表示して一覧へ戻すこと。404 にはしないこと。 |
| sheet-4-R049 | メンバー管理 | 実装違い | IO | P3 | 所属店舗を必須入力とし、未選択のまま登録・編集できないこと。 |
| sheet-5-R074 | 権限管理 | 実装違い | IO | P3 | 複製はリンクとして配置すること。 |

### sheet-5-R018 権限管理 — 未実装／ふるまい／P1

- 正本: sheet-5（権限管理） HTML行 1334 付近
- 正本引用: 「・新規で追加した機能はアクセス不可とする」
- 設計期待値: 権限URLマスタに機能を追加した直後は、どの権限からもアクセス不可であること。
- 実装参照: `src/Eccube/Resource/template/admin/Setting/System/authority.twig:313; src/Eccube/Security/Voter/AuthorityVoter.php:55-73; src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php:114-136`
- 実装実態: アクセス可否は拒否URLの登録有無だけで決まり、拒否URLが1件も無い新規の権限URLは全権限からアクセスできる。マトリックスでも既定でチェック済み（アクセス可）として表示される。
- 同じ実装実態でまとまる要求: sheet-5-R019（権限管理 / 実装参照 `src/Eccube/Resource/template/admin/Setting/System/authority.twig:313; src/Eccube/Security/Voter/AuthorityVoter.php:55-73`）
- 判定根拠: src/Eccube/Resource/template/admin/Setting/System/authority.twig:313 は「拒否URLに載っていなければチェック済み」と判定する。src/Eccube/Security/Voter/AuthorityVoter.php:55-73 も拒否URLに一致しなければACCESS_GRANTED を返す。権限URLマスタへ行を追加したときに全権限へ拒否URLを作る処理は src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php にも移行処理にも無く（app/DoctrineMigrations/Version20260313042709.php はマスタ行だけを追加する）、誰かが権限管理画面で保存するまでアクセス可のままになる。
- 確信度: high

### sheet-4-R055 メンバー管理 — 実装違い／IO／P2

- 正本: sheet-4（メンバー管理） HTML行 1220 付近
- 正本引用: 「1-8	権限グループ	単一選択(セレクトボックス)	○	-	-	選択肢:登録されている全権限」
- 設計期待値: 権限グループの選択肢に、登録されている全権限を出すこと。
- 実装参照: `src/Eccube/Form/Type/Admin/MemberType.php:115-119`
- 実装実態: 選択肢は「操作者自身の権限以上（a.id >= 操作者の権限ID）かつ表示可の権限」だけに絞られる。操作者より上位の権限は選択肢に出ず、そのメンバーには付与できない。
- 判定根拠: src/Eccube/Form/Type/Admin/MemberType.php:115-119 の query_builder が current_member_level で下限を絞り、isViewable=true も課している。ゲスト権限・顧客権限を除く点は正本の表示メッセージ（M11-01-MSG-014/015）と整合するが、上位権限の除外は正本に根拠が無い。
- 確信度: high

### sheet-4-R070 メンバー管理 — 未実装／ふるまい／P2

- 正本: sheet-4（メンバー管理） HTML行 1239 付近
- 正本引用: 「スマレジ用アカウントを有効にできるメンバーは同時に1人までとする。」
- 設計期待値: スマレジ用アカウントを有効にできるメンバーは同時に1人までとし、他に有効なメンバーが居る状態で有効化したときはエラーを表示して編集画面へ戻り、スマレジ用アカウントを変更しないこと。
- 実装参照: `src/Eccube/Form/Type/Admin/MemberType.php:171-174; src/Eccube/Service/Admin/Setting/System/MemberCreateAction.php; src/Eccube/Service/Admin/Setting/System/MemberEditAction.php`
- 実装実態: 他に有効なメンバーが居るかを確かめる処理が無く、複数のメンバーで同時に有効にできる。
- 同じ実装実態でまとまる要求: sheet-4-R076（メンバー管理 / 実装参照 `src/Eccube/Form/Type/Admin/MemberType.php:226-253; src/Eccube/Service/Admin/Setting/System/MemberEditAction.php:36-77`）、sheet-4-R084（メンバー管理 / 実装参照 `src/Eccube/Form/Type/Admin/MemberType.php:171-174; src/Eccube/Service/Admin/Setting/System/MemberEditAction.php:36-77`）
- 判定根拠: src/Eccube/Form/Type/Admin/MemberType.php:171-174 はチェックボックスを追加するだけで、src/Eccube/Service/Admin/Setting/System/MemberCreateAction.php/src/Eccube/Service/Admin/Setting/System/MemberEditAction.php にも重複判定は無い。src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:519-533 は「smaregi_member_flg は一意保証が無い」として複数該当時に id 昇順の1件目を採る実装になっており、一意でないことを前提にしている。
- 確信度: high

### sheet-6-R012 権限制御 — 実装違い／ふるまい／P2

- 正本: sheet-6（権限制御） HTML行 1481 付近
- 正本引用: 「2-2.2-1で定められた以外の機能については編集可能店舗の制御を入れずアクセス可能であれば編集可能とする」
- 設計期待値: 在庫管理・受注管理・店頭買取管理・イベント管理以外の機能では、編集可能店舗による制限をかけず、アクセスできるメンバーはそのまま編集できること。
- 実装参照: `src/Eccube/Service/Admin/Data/TopBannerUploadAction.php:40-42; src/Eccube/Controller/Admin/Mall/TenantController.php:232; src/Eccube/Controller/Admin/Mall/TenantController.php:251-255`
- 実装実態: データ管理のトップバナーアップロードとテナント管理（店舗情報の更新）でも編集可能店舗を判定しており、編集可能店舗に含まれない店舗を対象にすると、アクセスできても更新が拒否される。
- 判定根拠: src/Eccube/Entity/Member.php:78-91 の isEditableShop を呼ぶ箇所を全件走査すると、在庫（Stock）・受注（Order）・店頭買取（OtcBuyOrder）・イベント（Event）のほかに src/Eccube/Service/Admin/Data/TopBannerUploadAction.php:40 と src/Eccube/Controller/Admin/Mall/TenantController.php:232 の2箇所がある。前者は例外を投げ（同:41）、後者は POST を拒否して詳細画面へ戻す（同:251-255）。
- 確信度: high

### sheet-3-R050 メンバー管理一覧 — 実装違い／ふるまい／P3

- 正本: sheet-3（メンバー管理一覧） HTML行 1093 付近
- 正本引用: 「存在しなければ削除警告を表示し、一覧へ戻る。404 にはしない。」
- 設計期待値: 削除で対象メンバーが存在しないときは、削除警告を表示して一覧へ戻すこと。404 にはしないこと。
- 実装参照: `src/Eccube/Controller/Admin/Setting/System/MemberController.php:302-344`
- 実装実態: 削除も経路パラメータからメンバーを解決するため、存在しないIDでは警告を表示せず404になる。
- 同じ実装実態でまとまる要求: sheet-3-R058（メンバー管理一覧）
- 判定根拠: src/Eccube/Controller/Admin/Setting/System/MemberController.php:302-303 の delete は引数で Member を受け取り、解決できない場合は本体に入る前に404となる。削除警告を出す分岐は実装に存在しない。
- 確信度: high

### sheet-4-R049 メンバー管理 — 実装違い／IO／P3

- 正本: sheet-4（メンバー管理） HTML行 1214 付近
- 正本引用: 「1-2	所属店舗	単一選択(セレクトボックス)	○」
- 設計期待値: 所属店舗を必須入力とし、未選択のまま登録・編集できないこと。
- 実装参照: `src/Eccube/Form/Type/Admin/MemberType.php:121-129; src/Eccube/Form/Type/Admin/MemberType.php:181-190; src/Eccube/Controller/Admin/Setting/System/MemberController.php:117-119`
- 実装実態: 所属店舗は required=false で、必須エラーになるのはテナント権限（テナント運営者・テナントオーナー）のメンバーだけ。それ以外の権限では未選択でも保存でき、値はモール店舗で上書きされる。
- 判定根拠: src/Eccube/Form/Type/Admin/MemberType.php:121-129 は constraints を持たず、必須判定は src/Eccube/Form/Type/Admin/MemberType.php:181-190 のテナント権限のときだけ。src/Eccube/Form/Type/Admin/MemberType.php:264-266 と src/Eccube/Controller/Admin/Setting/System/MemberController.php:117-119 はテナント権限未満のメンバーの所属店舗をモール店舗に置き換える。
- 確信度: high

### sheet-5-R074 権限管理 — 実装違い／IO／P3

- 正本: sheet-5（権限管理） HTML行 1391 付近
- 正本引用: 「1-9	複製リンク	リンク	-	-	-	クリック時、該当の行と同権限の複製行を追加する」
- 設計期待値: 複製はリンクとして配置すること。
- 画像確認: sheet-5_img2.png（レイアウト図）を目視。操作列の「複製」は枠線のない文字として描かれており、ボタンの体裁ではない。
- 実装参照: `src/Eccube/Resource/template/admin/Setting/System/authority.twig:329-331`
- 実装実態: ボタンとして配置している（ラベルは「複製」）。
- 判定根拠: src/Eccube/Resource/template/admin/Setting/System/authority.twig:329-331 は button 要素に btn btn-ec-regular btn-copy を付けており、リンクではない。複製行を追加する挙動そのものは同:165-210 で実装されている。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 1件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 3件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0201/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 13 | 0 | 0 | 0 | 13 |
| sheet-2 | 目次 | 7 | 0 | 0 | 0 | 7 |
| sheet-3 | メンバー管理一覧 | 85 | 0 | 2 | 1 | 82 |
| sheet-4 | メンバー管理 | 94 | 4 | 4 | 0 | 86 |
| sheet-5 | 権限管理 | 103 | 2 | 1 | 0 | 100 |
| sheet-6 | 権限制御 | 14 | 0 | 1 | 0 | 13 |

