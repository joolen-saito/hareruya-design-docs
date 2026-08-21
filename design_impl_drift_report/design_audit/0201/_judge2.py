# -*- coding: utf-8 -*-
"""0201 の sheet-4/5/6 判定。_judge.py の後に実行して verdicts.tsv へ追記する。"""
import csv, os
BASE = os.path.dirname(os.path.abspath(__file__))
COLS = ["要求ID","判定","重要度","指摘区分","乖離種別","設計根拠_引用","設計期待値","実装参照","実装実態","判定根拠","画像確認メモ","確信度"]
reqs = list(csv.DictReader(open(os.path.join(BASE,'requirements.tsv'),encoding='utf-8'),delimiter='\t'))
V = {r['要求ID']: r for r in csv.DictReader(open(os.path.join(BASE,'verdicts.tsv'),encoding='utf-8'),delimiter='\t')}

def put(rid, verdict, why, conf='high', **kw):
    row = {c:'' for c in COLS}
    row.update({'要求ID':rid,'判定':verdict,'判定根拠':why,'確信度':conf}); row.update(kw)
    V[rid] = row

CTRL='src/Eccube/Controller/Admin/Setting/System/MemberController.php'
TWIG='src/Eccube/Resource/template/admin/Setting/System/member.twig'
EDIT='src/Eccube/Resource/template/admin/Setting/System/member_edit.twig'
TYPE='src/Eccube/Form/Type/Admin/MemberType.php'
REPO='src/Eccube/Repository/MemberRepository.php'
EMGR='src/Eccube/Service/EntityManager/MemberEntityManager.php'
EACT='src/Eccube/Service/Admin/Setting/System/MemberEditAction.php'
CACT='src/Eccube/Service/Admin/Setting/System/MemberCreateAction.php'
YAML='app/config/eccube/packages/eccube.yaml'
ATWIG='src/Eccube/Resource/template/admin/Setting/System/authority.twig'
ACTRL='src/Eccube/Controller/Admin/Setting/System/AuthorityController.php'
AACT='src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php'
VOTER='src/Eccube/Security/Voter/AuthorityVoter.php'
NAV='src/Eccube/EventListener/TwigInitializeListener.php'
PCTRL='src/Eccube/Controller/Admin/Setting/System/PermissionAccessUrlController.php'
MSG='src/Eccube/Resource/locale/messages.ja.yaml'

HEAD='見出し行であり、実装対象の要求ではない。'
PRE='カスタマイズの前置きで、個別の実装要求ではない。'

# ---- sheet-4 メンバー管理 --------------------------------------------------
put('sheet-4-R001','OUT_OF_SCOPE','節見出し「処理概要」。'+HEAD)
put('sheet-4-R002','OUT_OF_SCOPE','節見出し「要件説明」。'+HEAD)
put('sheet-4-R003','OUT_OF_SCOPE',PRE)
put('sheet-4-R004','OUT_OF_SCOPE','小見出し「所属について」。'+HEAD)
put('sheet-4-R005','MATCHED',f'{TYPE}:73-83 が所属を Department の EntityType（単一選択）にしている。自由入力ではない。')
put('sheet-4-R006','MATCHED',f'{TYPE}:81-82 が Department マスタを表示順昇順で選択肢にする。マスタの中身（部署）はデータであり実装側で固定していない。')
put('sheet-4-R007','OUT_OF_SCOPE','小見出し「デフォルト検索表示店舗について」。'+HEAD)
put('sheet-4-R008','MATCHED',f'{TYPE}:150-158 に defaultSearchBaseInfo を追加し、{EDIT}:196-201 が画面に出している。')
put('sheet-4-R009','MATCHED',f'{EDIT}:26-56 が所属店舗の選択値だけをデフォルト検索表示店舗の選択肢に入れ替える。')
put('sheet-4-R010','MATCHED',f'{TYPE}:150-158 で保持した値を各検索一覧が既定の店舗絞り込みに使う。'
    'メンバー管理側は値の保持と画面表示まで担う。')
put('sheet-4-R011','OUT_OF_SCOPE','小見出し「編集可能店舗について」。'+HEAD)
put('sheet-4-R012','MATCHED',f'{TYPE}:159-166 に editableBaseInfos を追加し、{EDIT}:203-211 が画面に出している。')
put('sheet-4-R013','MATCHED',f'{TYPE}:159-166 が multiple=true の複数選択で、{EACT}:52-68 が MemberBaseInfo を複数保存する。')
put('sheet-4-R014','MATCHED','在庫・受注・店頭買取・イベントの各機能が Member.isEditableShop で編集可否を判定している'
    '（src/Eccube/Entity/Member.php:78-91、src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:48、'
    'src/Eccube/Service/Admin/Stock/StockListMoveTransferSelectionValidator.php:38、'
    'src/Eccube/Resource/template/admin/Order/edit.twig:937、src/Eccube/Resource/template/admin/Event/index.twig:167）。')
put('sheet-4-R015','MATCHED','編集可能店舗の判定は Member.isEditableShop（src/Eccube/Entity/Member.php:78-91）に一本化されており、'
    '機能ごとに別の参照範囲を持たない。')
put('sheet-4-R016','OUT_OF_SCOPE','小見出し「自動ログアウトについて」。'+HEAD)
put('sheet-4-R017','MATCHED',f'{TYPE}:167-170 に設定項目があり、src/Eccube/EventListener/AdminAutoLogoutListener.php:88-100 が自動ログアウトを実行する。')
put('sheet-4-R018','MATCHED','src/Eccube/EventListener/AdminAutoLogoutListener.php:88-100 が最終操作からの経過時間で強制ログアウトする。')
put('sheet-4-R019','OUT_OF_SCOPE','要件の背景説明であり、実装すべき挙動を定めていない。')
put('sheet-4-R020','MATCHED','制限時間は追加システム設定の auto_logout_time（src/Eccube/Entity/Master/MtbOption.php:105、'
    'app/DoctrineMigrations/Version20251209091013.php:40）に1件だけ持ち、メンバーごとには持たない。')
put('sheet-4-R021','OUT_OF_SCOPE','小見出し「スマレジ用アカウントについて」。'+HEAD)
put('sheet-4-R022','MATCHED',f'{TYPE}:171-174 に smaregiMemberFlg を追加し、{EDIT}:246-254 が画面に出している。'
    'src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:519-533 がこのフラグで更新ユーザーを解決する。')
put('sheet-4-R023','MATCHED',f'{TYPE}:171-174 と {EDIT}:246-254 でスマレジ用アカウントを指定できる。')
put('sheet-4-R024','OUT_OF_SCOPE','小見出し「権限付与について（制限事項）」。'+HEAD)
put('sheet-4-R025','OUT_OF_SCOPE','制限事項である旨の前置きで、実装すべき挙動を定めていない。')
put('sheet-4-R026','MATCHED',f'{TYPE}:99-120 の Authority は multiple=false の単一選択で、1アカウントに1ロールだけ設定できる。')
put('sheet-4-R027','OUT_OF_SCOPE','節見出し「機能仕様処理概要」。'+HEAD)
put('sheet-4-R028','OUT_OF_SCOPE',PRE)
put('sheet-4-R029','OUT_OF_SCOPE','小見出し「項目の追加」。'+HEAD)
for rid in ('sheet-4-R030','sheet-4-R031'):
    put(rid,'OUT_OF_SCOPE','カスタマイズ説明の★識別IDずれ（本文の識別IDが項目表の識別IDと1つずれている）。'
        '追加すべき列は項目表側の識別IDで決まり、実装は項目表に追随済みのため指摘対象にしない（利用者指示 2026-08-19）。')
put('sheet-4-R032','OUT_OF_SCOPE','小見出し「所属について」。'+HEAD)
put('sheet-4-R033','MATCHED',f'{TYPE}:73-83 が単一選択のセレクトボックスにしている。')
put('sheet-4-R034','MATCHED',f'{TYPE}:81-82 が Department マスタを選択肢にする。')
put('sheet-4-R035','OUT_OF_SCOPE','小見出し「権限について」。'+HEAD)
put('sheet-4-R036','MATCHED',f'更新経路 admin_setting_system_member_update は {VOTER}:52-70 の拒否URL判定を受け、'
    f'権限が無ければアクセスできない。{EDIT}:293 も同じ判定で登録ボタンを無効化する。')
put('sheet-4-R037','MATCHED',f'{EDIT}:293-296 が is_accessable_route で更新権限を確かめ、権限が無ければ登録ボタンを disabled にする。')
put('sheet-4-R038','OUT_OF_SCOPE','小見出し「入力制限について」。'+HEAD)
put('sheet-4-R039','MATCHED',f'{TYPE}:67-174 の各項目が {YAML} の共通長（eccube_stext_len 255／eccube_id_max_len 50／'
    'eccube_password_max_len 50／eccube_email_len 255）に従っている。')
put('sheet-4-R040','OUT_OF_SCOPE','小見出し「編集可能店舗について」。'+HEAD)
put('sheet-4-R041','MATCHED',f'{TYPE}:159-166 が複数選択で、{EDIT}:24 が select2 でタグ表示にしている。')
put('sheet-4-R042','OUT_OF_SCOPE','小見出し「自動ログアウトについて」。'+HEAD)
put('sheet-4-R043','MATCHED','追加システム設定に auto_logout_time があり（src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:249-254）、'
    'src/Eccube/EventListener/AdminAutoLogoutListener.php:88 がその値を使う。')
put('sheet-4-R044','OUT_OF_SCOPE','小見出し「登録時の処理について」。'+HEAD)
put('sheet-4-R045','MATCHED',f'{CACT} と {EACT} が現行と同じ項目（所属店舗・スマレジ用アカウント等）を保存する。'
    '保存先が補助テーブルから管理者アカウント本体へ変わる点は現行仕様側に明記がある。')
put('sheet-4-R046','MATCHED',f'{TYPE}:159-166 の multiple=true と {EACT}:52-68 で複数登録できる。')
put('sheet-4-R047','OUT_OF_SCOPE','項目表の区分行「入力項目」。'+HEAD)
put('sheet-4-R048','MATCHED',f'{TYPE}:67-72 が名前を必須・最大 eccube_stext_len(255) にしている（{YAML}:141）。')
put('sheet-4-R049','DRIFT','所属店舗が必須になっていない。',
    重要度='P3',指摘区分='実装違い',乖離種別='IO',
    設計根拠_引用='1-2	所属店舗	単一選択(セレクトボックス)	○',
    設計期待値='所属店舗を必須入力とし、未選択のまま登録・編集できないこと。',
    実装参照=f'{TYPE}:121-129; {TYPE}:181-190; {CTRL}:117-119',
    実装実態='所属店舗は required=false で、必須エラーになるのはテナント権限（テナント運営者・テナントオーナー）のメンバーだけ。'
    'それ以外の権限では未選択でも保存でき、値はモール店舗で上書きされる。',
    判定根拠=f'{TYPE}:121-129 は constraints を持たず、必須判定は {TYPE}:181-190 のテナント権限のときだけ。'
    f'{TYPE}:264-266 と {CTRL}:117-119 はテナント権限未満のメンバーの所属店舗をモール店舗に置き換える。')
put('sheet-4-R050','MATCHED',f'{TYPE}:73-83 が所属を必須（NotBlank）の単一選択にし、Department マスタを選択肢にする。')
put('sheet-4-R051','MATCHED',f'{TYPE}:194-224 がログインIDを新規登録時のみ必須にし、最大 eccube_id_max_len(50) にしている（{YAML}:109）。')
put('sheet-4-R052','MATCHED',f'{TYPE}:138-147 がメールアドレスを必須・最大 eccube_email_len(255) にしている（{YAML}:253）。')
put('sheet-4-R053','MATCHED',f'{TYPE}:84-98 がパスワードを必須・最大 eccube_password_max_len(50) にしている（{YAML}:212）。')
put('sheet-4-R054','MATCHED',f'{TYPE}:84-98 の RepeatedPasswordType が確認欄を同じ制約で持つ。')
put('sheet-4-R055','DRIFT','権限グループの選択肢が「登録されている全権限」になっていない。',
    重要度='P2',指摘区分='実装違い',乖離種別='IO',
    設計根拠_引用='1-8	権限グループ	単一選択(セレクトボックス)	○	-	-	選択肢:登録されている全権限',
    設計期待値='権限グループの選択肢に、登録されている全権限を出すこと。',
    実装参照=f'{TYPE}:115-119',
    実装実態='選択肢は「操作者自身の権限以上（a.id >= 操作者の権限ID）かつ表示可の権限」だけに絞られる。'
    '操作者より上位の権限は選択肢に出ず、そのメンバーには付与できない。',
    判定根拠=f'{TYPE}:115-119 の query_builder が current_member_level で下限を絞り、isViewable=true も課している。'
    'ゲスト権限・顧客権限を除く点は正本の表示メッセージ（M11-01-MSG-014/015）と整合するが、上位権限の除外は正本に根拠が無い。')
put('sheet-4-R056','MATCHED',f'{TYPE}:150-158 が単一選択のセレクトボックスで、{EDIT}:196-201 が画面に出す。')
put('sheet-4-R057','MATCHED',f'{TYPE}:159-166 の複数選択を {EDIT}:24 の select2 がタグ表示にする。')
put('sheet-4-R058','MATCHED',f'{TYPE}:130-137 が Work を expanded=true のラジオボタンにし、{CTRL}:98 が新規作成時の初期値を非稼働にする。')
put('sheet-4-R059','MATCHED',f'{TYPE}:148-149 が ToggleSwitchType で、src/Eccube/Entity/Member.php:146-147 の初期値が false（無効）。')
put('sheet-4-R060','MATCHED',f'{TYPE}:167-170 が CheckboxType。')
put('sheet-4-R061','MATCHED',f'{TYPE}:171-174 が CheckboxType。')
put('sheet-4-R062','OUT_OF_SCOPE','項目表の区分行「ボタン、リンク」。'+HEAD)
put('sheet-4-R063','MATCHED',f'{EDIT}:283-287 がメンバー管理一覧（admin_setting_system_member）へのリンクを出す。')
put('sheet-4-R064','MATCHED',f'{EDIT}:294-296 の登録ボタンがフォームを送信し、{CTRL}:191-239 が入力値で更新する。')
put('sheet-4-R065','OUT_OF_SCOPE','取り込み元Markdownの見出し行。'+HEAD)
put('sheet-4-R066','OUT_OF_SCOPE','小見出し「パスワードの扱い」。'+HEAD)
put('sheet-4-R067','OUT_OF_SCOPE',
    f'平文で保持せずハッシュ化する点は {EMGR}:39-43 で満たしている。'
    'ソルトの生成方式（5文字のソルトを作る）は現行 pf-eccube3 の内部手段で、応答にも画面にも現れない。'
    '実装違いは I/O とふるまいに限るという方針により、手段の差は指摘対象にしない。')
put('sheet-4-R068','MATCHED',f'{CTRL}:161/194 が編集画面のパスワード欄に既定値（プレースホルダ）を入れ、'
    f'{EMGR}:39-43 が既定値のままなら再ハッシュせず既存のパスワードを維持する。')
put('sheet-4-R069','OUT_OF_SCOPE','小見出し「スマレジ用アカウントの排他」。'+HEAD)
put('sheet-4-R070','NOT_IMPLEMENTED','スマレジ用アカウントの排他判定が無い。',
    重要度='P2',指摘区分='未実装',乖離種別='ふるまい',
    設計根拠_引用='スマレジ用アカウントを有効にできるメンバーは同時に1人までとする。',
    設計期待値='スマレジ用アカウントを有効にできるメンバーは同時に1人までとし、他に有効なメンバーが居る状態で有効化したときは'
    'エラーを表示して編集画面へ戻り、スマレジ用アカウントを変更しないこと。',
    実装参照=f'{TYPE}:171-174; {CACT}; {EACT}',
    実装実態='他に有効なメンバーが居るかを確かめる処理が無く、複数のメンバーで同時に有効にできる。',
    判定根拠=f'{TYPE}:171-174 はチェックボックスを追加するだけで、{CACT}/{EACT} にも重複判定は無い。'
    'src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:519-533 は「smaregi_member_flg は一意保証が無い」として'
    '複数該当時に id 昇順の1件目を採る実装になっており、一意でないことを前提にしている。')
put('sheet-4-R071','OUT_OF_SCOPE','小見出し「保存の判定順序」。'+HEAD)
put('sheet-4-R072','OUT_OF_SCOPE','表の見出し行。'+HEAD)
put('sheet-4-R073','MATCHED',f'{CTRL}:116/204 が isValid でなければ保存に入らず、同一画面を再表示する。')
put('sheet-4-R074','MATCHED',f'{EMGR}:39-43 が既定値のままなら再ハッシュせず、変更されていればハッシュ化する。')
put('sheet-4-R075','MATCHED',f'{CTRL}:218-233 が例外を捕捉して保存失敗メッセージを出す。')
put('sheet-4-R076','NOT_IMPLEMENTED','スマレジ用アカウントの重複判定が無い。',
    重要度='P2',指摘区分='未実装',乖離種別='ふるまい',
    設計根拠_引用='有効なら重複エラーを表示して編集画面へ戻り、スマレジ用アカウントは変更しない。',
    設計期待値='スマレジ用アカウントを有効にできるメンバーは同時に1人までとし、他に有効なメンバーが居る状態で有効化したときは'
    'エラーを表示して編集画面へ戻り、スマレジ用アカウントを変更しないこと。',
    実装参照=f'{TYPE}:226-253; {EACT}:36-77',
    実装実態='他に有効なメンバーが居るかを確かめる処理が無く、複数のメンバーで同時に有効にできる。',
    判定根拠=f'保存の判定順序4に当たる処理が {EACT} にも {TYPE} の POST_SUBMIT にも無い。R070 と同一の実装実態。')
put('sheet-4-R077','MATCHED',f'{CTRL}:230/238 が保存後に完了メッセージを出して編集画面へ遷移する。'
    f'所属店舗は {CTRL}:205-207 と {EMGR}:45 で、スマレジ用アカウントはフォームのマッピングで保存される。')
put('sheet-4-R078','OUT_OF_SCOPE','小見出し「他機能との境界」。'+HEAD)
put('sheet-4-R079','OUT_OF_SCOPE','他シート（M11-01／M11-03）を正とする旨の記述で、本シートの実装要求ではない。')
put('sheet-4-R080','OUT_OF_SCOPE','金額計算・税率計算を行わない旨の記述で、実装すべき要求ではない。')
put('sheet-4-R081','OUT_OF_SCOPE','表の見出し行。'+HEAD)
put('sheet-4-R082','MATCHED',f'{TYPE}:67-174 が設計の入力項目をすべて持つ。')
put('sheet-4-R083','MATCHED',f'{CTRL}:230/238 が完了メッセージを出して編集画面を再表示する。')
put('sheet-4-R084','NOT_IMPLEMENTED','失敗時出力のうち、スマレジ用アカウントの重複エラーが出ない。',
    重要度='P2',指摘区分='未実装',乖離種別='ふるまい',
    設計根拠_引用='失敗時出力	項目ごとのエラー、保存失敗メッセージ、スマレジ用アカウントの重複エラー、対象が存在しない場合の 404',
    設計期待値='スマレジ用アカウントを有効にできるメンバーは同時に1人までとし、他に有効なメンバーが居る状態で有効化したときは'
    'エラーを表示して編集画面へ戻り、スマレジ用アカウントを変更しないこと。',
    実装参照=f'{TYPE}:171-174; {EACT}:36-77',
    実装実態='他に有効なメンバーが居るかを確かめる処理が無く、複数のメンバーで同時に有効にできる。',
    判定根拠=f'項目ごとのエラー・保存失敗メッセージ・404（{CTRL}:157-159 の経路解決）は実装されているが、'
    '重複エラーだけが無い。R070 と同一の実装実態。')
put('sheet-4-R085','OUT_OF_SCOPE','小見出し「入出力: 永続化」。'+HEAD)
put('sheet-4-R086','MATCHED',f'{CACT}/{EACT} が管理者アカウントを追加・更新し、設計の項目を保存する。'
    'ソルトは Symfony のハッシュ器がハッシュ文字列に内包する。')
put('sheet-4-R087','OUT_OF_SCOPE','表の見出し行。'+HEAD)
put('sheet-4-R088','MATCHED',f'{CTRL}:94-152 の新規登録が {CACT} を通して追加する。')
put('sheet-4-R089','MATCHED',f'{CTRL}:192-239 の編集が {EACT} を通して更新する。')
put('sheet-4-R090','MATCHED',f'{EMGR}:45-47 が所属店舗を管理者アカウント本体へ保存し、スマレジ用アカウントも同じ行に持つ'
    '（src/Eccube/Entity/Member.php）。所属マスタ・権限マスタ・稼働マスタ・店舗マスタは更新しない。')
put('sheet-4-R091','DRIFT','保存完了メッセージの文言が設計と違う。',
    重要度='P3',指摘区分='実装違い',乖離種別='IO',
    設計根拠_引用='メンバーを保存しました。',
    設計期待値='保存が完了したときは「メンバーを保存しました。」と表示すること。',
    実装参照=f'{CTRL}:131; {CTRL}:230; {MSG}:1595',
    実装実態='表示するのは共通文言の「保存しました」。',
    判定根拠=f'{CTRL}:131/230 が admin.common.save_complete を使い、{MSG}:1595 の文言は「保存しました」。')
put('sheet-4-R092','DRIFT','保存失敗メッセージの文言が設計と違う。',
    重要度='P3',指摘区分='実装違い',乖離種別='IO',
    設計根拠_引用='メンバーを保存できませんでした。',
    設計期待値='保存が失敗したときは「メンバーを保存できませんでした。」と表示すること。',
    実装参照=f'{CTRL}:133; {CTRL}:232; {MSG}:1596',
    実装実態='表示するのは共通文言の「保存に失敗しました」。',
    判定根拠=f'{CTRL}:133/232/235 が admin.common.save_error を使い、{MSG}:1596 の文言は「保存に失敗しました」。')
put('sheet-4-R093','NOT_IMPLEMENTED','スマレジ用アカウント重複時のメッセージが無い。',
    重要度='P3',指摘区分='未実装',乖離種別='IO',
    設計根拠_引用='スマレジ用アカウントフラグが立っているアカウントが既に存在しています。',
    設計期待値='スマレジ用アカウントを有効にしたときに他に有効なメンバーが居れば、その旨のメッセージを表示すること。',
    実装参照=f'{MSG}; {TYPE}:171-174',
    実装実態='重複を判定していないため、当該メッセージは実装に存在しない。',
    判定根拠=f'{MSG} に該当文言のキーが無く、{TYPE}/{EACT} に重複判定も無い。')
put('sheet-4-R094','MATCHED',f'{CTRL}:116/204 が isValid でなければ保存せず、{EDIT} の form_errors が項目直下にエラーを出す。'
    '完了メッセージは保存が成功した経路でしか出ない。')

# ---- sheet-5 権限管理 ------------------------------------------------------
put('sheet-5-R001','OUT_OF_SCOPE','節見出し「処理概要」。'+HEAD)
put('sheet-5-R002','OUT_OF_SCOPE','節見出し「要件説明」。'+HEAD)
put('sheet-5-R003','OUT_OF_SCOPE',PRE)
put('sheet-5-R004','MATCHED',f'{ATWIG}:278-336 が権限×機能のマトリックスを描画する。')
put('sheet-5-R005','MATCHED',f'{ATWIG}:282-305 が権限URLマスタ（PermissionGroup／PermissionAccessUrl）の内容から列を組み立てる。'
    f'マスタは {PCTRL}:55-57 の権限URLマスターデータ画面で管理する。')
put('sheet-5-R006','OUT_OF_SCOPE','小見出し「UIについて」。'+HEAD)
put('sheet-5-R007','MATCHED',f'{ATWIG}:278-336 のマトリックスで権限管理ができる。')
put('sheet-5-R008','MATCHED',f'{ATWIG}:314-325 が各セルにチェックボックスを置く。')
put('sheet-5-R009','OUT_OF_SCOPE','小見出し「権限設定について」。'+HEAD)
put('sheet-5-R010','MATCHED','権限はURL単位（mtb_permission_access_url の url 列、src/Eccube/Entity/PermissionAccessUrl.php:23）で持ち、'
    f'ページ名との対応は {PCTRL}:55-57 の権限URLマスターデータ画面で管理する。')
put('sheet-5-R011','MATCHED',f'{ATWIG}:314-325 のチェックボックスはON（アクセス可）とOFF（アクセス不可）の2値。')
put('sheet-5-R012','MATCHED',f'{ATWIG}:290-294 が権限URLマスタの行数だけ列を出すため、閲覧権限を登録すれば閲覧の列が増える。')
put('sheet-5-R013','OUT_OF_SCOPE','小見出し「権限レベルについて」。'+HEAD)
put('sheet-5-R014','MATCHED',f'権限レベル（優先度）は権限URLマスタの priority 列に持ち、{PCTRL}:55-57 の画面で設定できる。')
put('sheet-5-R015','MATCHED',f'{ATWIG}:117-148 updateGroupLocks が、同じ機能グループで優先度の小さい列がONのとき'
    '優先度の大きい列を checked かつ locked（{ATWIG}:61-65 で pointer-events を無効）にする。')
put('sheet-5-R016','OUT_OF_SCOPE','小見出し「アクセス不可条件について」。'+HEAD)
put('sheet-5-R017','MATCHED',f'{AACT}:114-136 がチェックOFFの権限URLを拒否URLとして登録し、{VOTER}:55-70 がアクセスを拒否する。')
put('sheet-5-R018','NOT_IMPLEMENTED','新しく追加した権限URLが、既定でアクセス可になっている。',
    重要度='P1',指摘区分='未実装',乖離種別='ふるまい',
    設計根拠_引用='・新規で追加した機能はアクセス不可とする',
    設計期待値='権限URLマスタに機能を追加した直後は、どの権限からもアクセス不可であること。',
    実装参照=f'{ATWIG}:313; {VOTER}:55-73; {AACT}:114-136',
    実装実態='アクセス可否は拒否URLの登録有無だけで決まり、拒否URLが1件も無い新規の権限URLは全権限からアクセスできる。'
    'マトリックスでも既定でチェック済み（アクセス可）として表示される。',
    判定根拠=f'{ATWIG}:313 は「拒否URLに載っていなければチェック済み」と判定する。{VOTER}:55-73 も拒否URLに一致しなければ'
    f'ACCESS_GRANTED を返す。権限URLマスタへ行を追加したときに全権限へ拒否URLを作る処理は {AACT} にも移行処理にも無く'
    '（app/DoctrineMigrations/Version20260313042709.php はマスタ行だけを追加する）、誰かが権限管理画面で保存するまでアクセス可のままになる。')
put('sheet-5-R019','NOT_IMPLEMENTED','未設定の権限URLが、既定でアクセス可になっている。',
    重要度='P1',指摘区分='未実装',乖離種別='ふるまい',
    設計根拠_引用='・未設定項目がある場合はアクセス不可とする（アクセス可、アクセス不可が入力されていない場合）',
    設計期待値='アクセス可・アクセス不可のいずれも登録されていない権限URLは、アクセス不可として扱うこと。',
    実装参照=f'{ATWIG}:313; {VOTER}:55-73',
    実装実態='アクセス可否は拒否URLの登録有無だけで決まり、拒否URLが1件も無い新規の権限URLは全権限からアクセスできる。'
    'マトリックスでも既定でチェック済み（アクセス可）として表示される。',
    判定根拠='未設定（拒否URL行が無い状態）と明示的な許可を区別する持ち方が無い。R018 と同一の実装実態。')
put('sheet-5-R020','OUT_OF_SCOPE','小見出し「権限の複製について」。'+HEAD)
put('sheet-5-R021','MATCHED',f'{ATWIG}:165-210 handleCopyClick が行を複製する。')
put('sheet-5-R022','OUT_OF_SCOPE','小見出し「運用想定」。'+HEAD)
put('sheet-5-R023','OUT_OF_SCOPE','運用上の想定であり、実装すべき挙動を定めていない（同一権限で管理するかは権限URLマスタの登録内容で決まる）。')
put('sheet-5-R024','OUT_OF_SCOPE','運用想定の例示。実装すべき挙動を定めていない。')
put('sheet-5-R025','OUT_OF_SCOPE','運用上の想定であり、実装すべき挙動を定めていない。')
put('sheet-5-R026','OUT_OF_SCOPE','運用上の想定であり、実装すべき挙動を定めていない。')
put('sheet-5-R027','OUT_OF_SCOPE','節見出し「機能仕様処理概要」。'+HEAD)
put('sheet-5-R028','OUT_OF_SCOPE',PRE)
put('sheet-5-R029','OUT_OF_SCOPE','小見出し「UIについて」。'+HEAD)
put('sheet-5-R030','MATCHED',f'{ATWIG}:278-336 がマトリックス表示。')
put('sheet-5-R031','MATCHED',f'{ATWIG}:314-325 のチェックで、{AACT}:114-136 が拒否URLの登録・削除を行う。')
put('sheet-5-R032','MATCHED',f'{ATWIG}:139-142 が下位（優先度の大きい）チェックボックスを checked にする。')
put('sheet-5-R033','MATCHED',f'{ATWIG}:142 が locked クラスを付け、同:61-65 の CSS が半透明かつ操作不可にする。')
put('sheet-5-R034','OUT_OF_SCOPE','小見出し「優先度について」。'+HEAD)
put('sheet-5-R035','MATCHED',f'{ATWIG}:133-139 が最小の優先度を基準に、それより大きい優先度を従属させる。数字が小さい方が優先。')
put('sheet-5-R036','OUT_OF_SCOPE','小見出し「登録処理について」。'+HEAD)
put('sheet-5-R037','MATCHED',f'{AACT}:114-120 がチェックONの権限URLを拒否URLに含めない＝アクセス可能にする。')
put('sheet-5-R038','MATCHED',f'{ATWIG}:139-142 が下位権限も checked にし、送信時に同じ権限として登録される。')
put('sheet-5-R039','MATCHED',f'優先度は権限URLマスタの priority 列に持ち、{PCTRL}:55-57 の画面で設定できる。')
put('sheet-5-R040','MATCHED',f'{AACT}:65/116-136 が権限URLマスタから URL を取り、拒否URLの登録・削除を行う。')
put('sheet-5-R041','MATCHED',f'{AACT}:125-129 がチェックONになった権限URLの拒否URL行を削除する。')
put('sheet-5-R042','OUT_OF_SCOPE','小見出し「複製について」。'+HEAD)
put('sheet-5-R043','MATCHED',f'{ATWIG}:175-192 が元の行のチェック状態をそのまま複製行に写す。')
put('sheet-5-R044','MATCHED',f'{ATWIG}:180-183 が権限名の入力欄を出し、{ATWIG}:349-353 の画面下部の登録ボタンで送信する。')
put('sheet-5-R045','MATCHED',f'{ATWIG}:182 の required で必須にし、{AACT}:73-77 が同名の権限があれば例外を投げて登録しない'
    f'（文言は {MSG}:3270 admin.setting.system.authority.exists_already_name）。')
put('sheet-5-R046','MATCHED',f'{AACT}:68-90 が新しい権限をマスタへ登録し、そのIDで権限設定を保存する。')
put('sheet-5-R047','OUT_OF_SCOPE','小見出し「アクセス制御について」。'+HEAD)
put('sheet-5-R048','MATCHED',f'{VOTER}:24-74 の標準のアクセス制御（AuthorityVoter）をそのまま使っている。')
put('sheet-5-R049','OUT_OF_SCOPE','小見出し「列の追加について」。'+HEAD)
put('sheet-5-R050','MATCHED',f'{PCTRL}:55-57 の権限URLマスターデータ画面で権限URLを追加できる。')
put('sheet-5-R051','MATCHED',f'{ACTRL}:117-127 が画面表示のたびに権限URLマスタを読み直し、{ATWIG}:282-305 が操作列の左に列を並べる。')
put('sheet-5-R052','OUT_OF_SCOPE','小見出し「権限の新規登録について」。'+HEAD)
put('sheet-5-R053','MATCHED',f'権限は {PCTRL}:55-57 のマスターデータ画面で作成し、{ATWIG}:308-334 の当画面で設定する。')
put('sheet-5-R054','OUT_OF_SCOPE','小見出し「登録処理」。'+HEAD)
put('sheet-5-R055','MATCHED',f'{AACT}:106-137 が標準機能の権限と拒否URLを生成・登録する。')
put('sheet-5-R056','OUT_OF_SCOPE','用語の注記であり、実装すべき挙動を定めていない。')
put('sheet-5-R057','MATCHED',f'{AACT}:106-120 が画面のチェック内容と権限URLマスタを突き合わせ、権限ごとに拒否URLの一覧を作る。')
put('sheet-5-R058','MATCHED',f'{AACT}:125-129 がチェックONで拒否URLを削除し、同:132-136 がチェックOFFで拒否URLを登録する。')
put('sheet-5-R059','OUT_OF_SCOPE','小見出し「承認権限」。'+HEAD)
put('sheet-5-R060','MATCHED','app/DoctrineMigrations/Version20260313042709.php:30-58 が承認権限のマスタを登録し、'
    'src/Eccube/Repository/MemberRepository.php:176/242 が承認者の絞り込みに使う。')
put('sheet-5-R061','MATCHED','app/DoctrineMigrations/Version20260313042709.php:33-58 が大カテゴリ「承認権限」・権限名「承認権限」・'
    'URL「/approval_authority」・優先度1 をそのまま登録している。')
put('sheet-5-R062','MATCHED','src/Eccube/Repository/MemberRepository.php:176/242 と '
    'src/Eccube/Repository/DtbStockApprovalListRepository.php:119/245 が、/approval_authority を拒否されていないメンバーを承認者として扱う。')
put('sheet-5-R063','OUT_OF_SCOPE','項目表の区分行「権限管理一覧」。'+HEAD)
put('sheet-5-R064','MATCHED',f'{ATWIG}:280-287 が機能名行を出す。')
put('sheet-5-R065','MATCHED',f'{ATWIG}:282-285 が権限グループ名（各種管理機能名）を出す。')
put('sheet-5-R066','MATCHED',f'{ATWIG}:295/328-332 が操作列を出す。')
put('sheet-5-R067','MATCHED',f'{ATWIG}:288-296 が権限名行を出す。')
put('sheet-5-R068','MATCHED',f'{ATWIG}:290-294 が権限URLマスタの登録数だけ列を出す。')
put('sheet-5-R069','MATCHED',f'{ATWIG}:290-294 がマスタの件数分の列を出す。')
put('sheet-5-R070','MATCHED',f'{ATWIG}:297-305 が優先度行を出す。')
put('sheet-5-R071','MATCHED',f'{ATWIG}:308-310 が権限（Authorities）の数だけ行を出す。'
    f'{ACTRL}:59-62 が表示可の権限を表示順で取得する。')
put('sheet-5-R072','MATCHED',f'{ATWIG}:314-325 の各セルのチェックボックスがアクセス可否を表す。')
put('sheet-5-R073','MATCHED',f'{ATWIG}:313 が拒否URLに載っていない（＝アクセス可能な）ものをチェック済みにする。')
put('sheet-5-R074','DRIFT','複製がリンクではなくボタンとして配置されている。',
    重要度='P3',指摘区分='実装違い',乖離種別='IO',
    設計根拠_引用='1-9	複製リンク	リンク	-	-	-	クリック時、該当の行と同権限の複製行を追加する',
    設計期待値='複製はリンクとして配置すること。',
    実装参照=f'{ATWIG}:329-331',
    実装実態='ボタンとして配置している（ラベルは「複製」）。',
    判定根拠=f'{ATWIG}:329-331 は button 要素に btn btn-ec-regular btn-copy を付けており、リンクではない。'
    '複製行を追加する挙動そのものは同:165-210 で実装されている。',
    画像確認メモ='sheet-5_img2.png（レイアウト図）を目視。操作列の「複製」は枠線のない文字として描かれており、ボタンの体裁ではない。')
put('sheet-5-R075','MATCHED',f'{ATWIG}:175-208 が複製行を tbody へ追加する。')
put('sheet-5-R076','MATCHED',f'{ATWIG}:182 が required のテキスト入力を出し、{AACT}:73-77 が重複名を拒否する。')
put('sheet-5-R077','OUT_OF_SCOPE','項目表の区分行「画面下部ボタン」。'+HEAD)
put('sheet-5-R078','MATCHED',f'{ATWIG}:349-353 の登録ボタンがフォームを送信し、{ACTRL}:85-114 が入力値で登録する。')
put('sheet-5-R079','OUT_OF_SCOPE','取り込み元Markdownの見出し行。'+HEAD)
put('sheet-5-R080','OUT_OF_SCOPE','小見出し「拒否URLの一覧」。'+HEAD)
put('sheet-5-R081','OUT_OF_SCOPE',
    '現行仕様は拒否URLを1行ずつ並べる一覧を前提にしているが、本設計書の要件説明・機能仕様は'
    '権限×機能のマトリックスに置き換えると定めており、リニューアル後の仕様が優先する。現行仕様側のこの記述は踏襲対象ではない。')
put('sheet-5-R082','OUT_OF_SCOPE','小見出し「保存の扱い」。'+HEAD)
put('sheet-5-R083','OUT_OF_SCOPE',
    '「表示していた行を全削除して登録し直す」は現行の拒否URL一覧画面の保存方式で、マトリックスへの置き換えにより'
    f'差分だけを登録・削除する方式（{AACT}:122-136）に変わる。リニューアル後の仕様が優先するため踏襲対象ではない。')
put('sheet-5-R084','OUT_OF_SCOPE','小見出し「アクセス拒否の判定」。'+HEAD)
put('sheet-5-R085','MATCHED',f'{VOTER}:52-70 がログイン中のメンバーの権限に紐づく拒否URLと遷移先パスを先頭一致で照合し、'
    '一致すれば ACCESS_DENIED を返す。')
put('sheet-5-R086','MATCHED',f'{VOTER}:50 が Member のときだけ拒否URLを適用する。')
put('sheet-5-R087','OUT_OF_SCOPE','小見出し「左ナビゲーションの抑制」。'+HEAD)
put('sheet-5-R088','MATCHED',f'{NAV}:204-251 が拒否URLに前方一致するメニューを取り除き、子が全て消えた親も取り除く。'
    '判定の手段（親を階層連結で見るか子の残数で見るか）は違うが、拒否URLに該当する項目が表示されないという結果は同じ。')
put('sheet-5-R089','OUT_OF_SCOPE','小見出し「他機能との境界」。'+HEAD)
put('sheet-5-R090','OUT_OF_SCOPE','他シート（M11-02）を正とする旨の記述で、本シートの実装要求ではない。')
put('sheet-5-R091','OUT_OF_SCOPE','件数集計・金額計算を行わない旨の記述で、実装すべき要求ではない。')
put('sheet-5-R092','OUT_OF_SCOPE','表の見出し行。'+HEAD)
put('sheet-5-R093','MATCHED',f'{ACTRL}:86-94 が権限ごとのチェック内容を受け取り、{AACT} が権限と拒否URLの組にする。')
put('sheet-5-R094','MATCHED',f'{ACTRL}:108/114 が保存完了メッセージを出して権限管理画面へ戻る。')
put('sheet-5-R095','MATCHED',f'{ACTRL}:110-111 が例外の内容と保存失敗をメッセージにする。')
put('sheet-5-R096','OUT_OF_SCOPE','小見出し「入出力: 永続化」。'+HEAD)
put('sheet-5-R097','MATCHED','拒否URLは dtb_authority_role（src/Eccube/Entity/AuthorityRole.php）に権限と拒否URLの組で持つ。')
put('sheet-5-R098','OUT_OF_SCOPE','表の見出し行。'+HEAD)
put('sheet-5-R099','MATCHED',f'{AACT}:125-136 が保存時に拒否URLの削除と登録を行う。')
put('sheet-5-R100','OUT_OF_SCOPE',
    f'拒否URLを表示のたびに読み直す点は {ACTRL}:117 で満たしている。'
    '一方「権限マスタは更新しない」は現行の拒否URL一覧画面を前提とした記述で、本設計書は権限の複製で権限を新規作成すると'
    f'定めており（機能仕様「・権限を新規作成し登録する」、{AACT}:68-90）、リニューアル後の仕様が優先する。')
put('sheet-5-R101','MATCHED',f'設計の文言「保存しました」は {MSG}:1595 admin.common.save_complete と {ACTRL}:108 で一致する。')
put('sheet-5-R102','MATCHED',f'設計の文言「保存に失敗しました」は {MSG}:1596 admin.common.save_error と {ACTRL}:111 で一致する。')
put('sheet-5-R103','MATCHED',f'{ACTRL}:85 が isValid でなければ保存に入らず、登録内容を変更しない。')

# ---- sheet-6 権限制御 ------------------------------------------------------
put('sheet-6-R001','OUT_OF_SCOPE','節見出し「処理内容」。'+HEAD)
put('sheet-6-R002','OUT_OF_SCOPE','本シートの位置づけの説明で、個別の実装要求ではない。')
put('sheet-6-R003','OUT_OF_SCOPE','実現方式の前置きで、個別の実装要求ではない。')
put('sheet-6-R004','OUT_OF_SCOPE','節見出し「機能仕様処理内容」。'+HEAD)
put('sheet-6-R005','OUT_OF_SCOPE','小見出し「1.アクセス可能判定処理」。'+HEAD)
put('sheet-6-R006','MATCHED',f'{VOTER}:52 がログイン中のメンバーの権限（Authority）に紐づく権限判定データを参照する。')
put('sheet-6-R007','MATCHED',f'{VOTER}:55-70 が遷移先パスと拒否URLを先頭一致で照合し、一致すればアクセスを拒否する。')
put('sheet-6-R008','MATCHED',f'{VOTER}:73 が拒否URLに一致しなければ ACCESS_GRANTED を返す。')
put('sheet-6-R009','OUT_OF_SCOPE','用語の注記であり、実装すべき挙動を定めていない。')
put('sheet-6-R010','OUT_OF_SCOPE','小見出し「2.編集可能店舗処理」。'+HEAD)
put('sheet-6-R011','MATCHED','在庫・受注・店頭買取・イベントの各機能が Member.isEditableShop（src/Eccube/Entity/Member.php:78-91）で'
    '編集可否を判定している（src/Eccube/Service/Admin/Stock/StockListMoveTransferSelectionValidator.php:38、'
    'src/Eccube/Resource/template/admin/Order/edit.twig:937、src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:48、'
    'src/Eccube/Resource/template/admin/Event/index.twig:167）。')
put('sheet-6-R012','MATCHED','isEditableShop の呼び出しは在庫・受注・店頭買取・イベントと、それらに付随する分析・データ管理に限られ、'
    'それ以外の機能に編集可能店舗の判定は入っていない。')
put('sheet-6-R013','MATCHED','src/Eccube/Resource/template/admin/Order/edit.twig:937-993 のように、編集可能店舗でない場合も'
    '画面は表示し、更新系の操作だけを出さない作りになっている。')
put('sheet-6-R014','MATCHED','src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:48、'
    'src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:44、'
    'src/Eccube/Controller/Admin/Order/WaitingTagController.php:123/169 が、更新時に編集可能店舗でなければ権限エラーにして更新しない。')

missing = [r['要求ID'] for r in reqs if r['要求ID'] not in V]
if missing:
    raise SystemExit('未判定: %d件 %s' % (len(missing), missing[:10]))
with open(os.path.join(BASE,'verdicts.tsv'),'w',encoding='utf-8',newline='') as fh:
    w=csv.DictWriter(fh,fieldnames=COLS,delimiter='\t',lineterminator='\n'); w.writeheader()
    for r in reqs:
        w.writerow({c: V[r['要求ID']].get(c,'') for c in COLS})
print('wrote', len(reqs), 'verdicts')
