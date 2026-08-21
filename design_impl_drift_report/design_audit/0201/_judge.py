# -*- coding: utf-8 -*-
"""0201 システム設定 の判定を組み立てる。正本HTML(sheets/*.txt)と ec-cube-enterprise HEAD の突合結果。"""
import csv, os
BASE = os.path.dirname(os.path.abspath(__file__))
COLS = ["要求ID","判定","重要度","指摘区分","乖離種別","設計根拠_引用","設計期待値","実装参照","実装実態","判定根拠","画像確認メモ","確信度"]
reqs = list(csv.DictReader(open(os.path.join(BASE,'requirements.tsv'),encoding='utf-8'),delimiter='\t'))
V = {}

def put(rid, verdict, why, conf='high', **kw):
    row = {c:'' for c in COLS}
    row.update({'要求ID':rid,'判定':verdict,'判定根拠':why,'確信度':conf})
    row.update(kw)
    V[rid] = row

def rng(sheet, lo, hi):
    return [f'{sheet}-R{n:03d}' for n in range(lo, hi+1)]

MEMBER_CTRL = 'src/Eccube/Controller/Admin/Setting/System/MemberController.php'
MEMBER_TWIG = 'src/Eccube/Resource/template/admin/Setting/System/member.twig'
EDIT_TWIG   = 'src/Eccube/Resource/template/admin/Setting/System/member_edit.twig'
MEMBER_TYPE = 'src/Eccube/Form/Type/Admin/MemberType.php'
MEMBER_REPO = 'src/Eccube/Repository/MemberRepository.php'
MSG = 'src/Eccube/Resource/locale/messages.ja.yaml'
VAL = 'src/Eccube/Resource/locale/validators.ja.yaml'

for rid in rng('sheet-1',1,13):
    put(rid,'OUT_OF_SCOPE','表紙の宛名・書名・改訂履歴であり、実装対象の要求ではない。')
for rid in rng('sheet-2',1,7):
    put(rid,'OUT_OF_SCOPE','目次の見出しであり、実装対象の要求ではない。')

put('sheet-3-R001','OUT_OF_SCOPE','節見出し「処理概要」。要求ではない。')
put('sheet-3-R002','OUT_OF_SCOPE','節見出し「要件説明」。要求ではない。')
put('sheet-3-R003','OUT_OF_SCOPE','カスタマイズの前置き（標準機能をベースにする旨）で、個別の実装要求ではない。')
put('sheet-3-R004','MATCHED','所属・権限のソートと絞り込みはいずれも実装されている。'
    f'絞り込みは {MEMBER_TWIG}:92-105 のセレクトボックスと同:22-42 の filterMembers、'
    'ソートは同:117-124 の sortable 見出しと同:57-77 の並べ替えで実現している。')
put('sheet-3-R005','OUT_OF_SCOPE','節見出し「機能仕様処理概要」。要求ではない。')
put('sheet-3-R006','OUT_OF_SCOPE','カスタマイズの前置き。個別の実装要求ではない。')
put('sheet-3-R007','OUT_OF_SCOPE','小見出し「ソート機能、絞り込みの追加」。要求ではない。')
put('sheet-3-R008','MATCHED',f'{MEMBER_TWIG}:92-105 に所属・権限のセレクトボックスがあり、同:117-124 の見出しにソートが付いている。')
put('sheet-3-R009','MATCHED',f'{MEMBER_TWIG}:93 の filter_department を変更すると同:22-42 filterMembers が行の data-department-id と突き合わせて表示を絞り込む。')
put('sheet-3-R010','MATCHED',f'{MEMBER_TWIG}:100 の filter_authority を変更すると同:22-42 filterMembers が行の data-authority-id と突き合わせて表示を絞り込む。')
put('sheet-3-R011','MATCHED',f'{MEMBER_TWIG}:117-120 の所属見出しに sortable が付き、同:57-77 のクリックハンドラが data-department-name で並べ替える。')
put('sheet-3-R012','MATCHED',f'{MEMBER_TWIG}:121-124 の権限見出しに sortable が付き、同:57-77 のクリックハンドラが data-authority-name で並べ替える。')
put('sheet-3-R013','OUT_OF_SCOPE','小見出し「項目の追加」。要求ではない。')
put('sheet-3-R014','DESIGN_ISSUE',
    '正本の項目表（識別ID 1-1〜1-3）とレイアウト図の絞り込み欄はいずれも所属と権限の2つだけで、'
    'デフォルト検索表示店舗（2-4）は表示リスト側の項目として定義されている。'
    '機能仕様のこの1行だけが 2-4 を絞り込み条件として扱っており、正本内部で記述が食い違う。どちらを正とするかは設計判断が要る。',
    設計根拠_引用='・識別ID:2-4「デフォルト検索表示店舗」を選択時、選択された店舗で表示を絞り込む',
    画像確認メモ='sheet-3_img1.png（レイアウト図）を目視。画面上部の絞り込み欄は所属と権限の2つのみで、デフォルト検索表示店舗は一覧の列として描かれている。')
put('sheet-3-R015','MATCHED',f'R009 と同じ要求の重複記述。{MEMBER_TWIG}:22-42 で実装済み。')
put('sheet-3-R016','MATCHED',f'R010 と同じ要求の重複記述。{MEMBER_TWIG}:22-42 で実装済み。')
put('sheet-3-R017','OUT_OF_SCOPE','項目表の区分行「画面上部」。要求ではない。')
put('sheet-3-R018','MATCHED',f'{MEMBER_TWIG}:87-89 に新規登録ボタンがあり admin_setting_system_member_new へ遷移する。')
put('sheet-3-R019','MATCHED',f'{MEMBER_TWIG}:92-98 が Departments を選択肢に出す。Departments は {MEMBER_CTRL}:78 で所属マスタから表示順昇順で取得している。')
put('sheet-3-R020','MATCHED',f'{MEMBER_TWIG}:22-42 が選択値で行を絞り込む。')
put('sheet-3-R021','MATCHED',f'{MEMBER_TWIG}:99-105 が Authorities を選択肢に出す。Authorities は {MEMBER_CTRL}:79 で権限マスタ全件を表示順昇順で取得している。')
put('sheet-3-R022','MATCHED',f'{MEMBER_TWIG}:22-42 が選択値で行を絞り込む。')
put('sheet-3-R023','OUT_OF_SCOPE','項目表の区分行「表示リスト」。要求ではない。')
put('sheet-3-R024','MATCHED',f'{MEMBER_TWIG}:143-145 が一覧の名前列を出力している。')
put('sheet-3-R025','MATCHED',f'{MEMBER_TWIG}:117-120 が所属列をソート用リンクとして出し、同:146-148 が値を表示する。')
put('sheet-3-R026','MATCHED',f'{MEMBER_TWIG}:121-124 が権限列をソート用リンクとして出し、同:149-151 が値を表示する。')
put('sheet-3-R027','MATCHED',f'{MEMBER_TWIG}:152-154 がデフォルト検索表示店舗列を出力している。')
put('sheet-3-R028','MATCHED',f'{MEMBER_TWIG}:155-161 が編集可能店舗列を出力している。')
put('sheet-3-R029','MATCHED',f'{MEMBER_TWIG}:162-164 が自動ログアウト列を出力している。')
put('sheet-3-R030','MATCHED',f'{MEMBER_TWIG}:165-177 が2段階認証列を出力している。')
put('sheet-3-R031','MATCHED',f'{MEMBER_TWIG}:178-378 に編集・上へ・下へ・削除のアイコンがあり、それぞれ対応する処理へリンクしている。')
put('sheet-3-R032','MATCHED',f'{MEMBER_TWIG}:208-235（編集）・252-281（上へ）・299-328（下へ）・347-376（削除）で、実行前に確認モーダルを表示する。')
put('sheet-3-R033','OUT_OF_SCOPE','取り込み元Markdownの見出し行。要求ではない。')
put('sheet-3-R034','OUT_OF_SCOPE','小見出し「一覧の対象と並び」。要求ではない。')
put('sheet-3-R035','MATCHED',f'{MEMBER_CTRL}:63 が sort_no の降順で取得しており、値が大きい行が先頭に来る。')
put('sheet-3-R036','MATCHED',f'{MEMBER_REPO}:116-135 の delete が対象行を remove する物理削除で、削除済み行自体が残らない。一覧側に除外条件は不要。')
put('sheet-3-R037','MATCHED',f'{MEMBER_CTRL}:63 の取得条件は空で、稼働状態による絞り込みを行っていない。')
put('sheet-3-R038','OUT_OF_SCOPE',
    '現行仕様は絞り込みもページングも持たないとするが、本設計書の要件説明・機能仕様は所属と権限での絞り込みを追加すると定めており、'
    'リニューアル後の仕様が優先する。現行仕様側のこの記述は踏襲対象ではない。')
put('sheet-3-R039','OUT_OF_SCOPE','小見出し「表示順の入れ替え」。要求ではない。')
put('sheet-3-R040','MATCHED',f'{MEMBER_REPO}:44-60 の up が sort_no+1 の行と、同:67-83 の down が sort_no-1 の行と表示順を交換する。')
put('sheet-3-R041','MATCHED',f'{MEMBER_REPO}:49-51/72-74 が隣接行不在で例外を投げ、{MEMBER_CTRL}:261-265/290-294 が失敗メッセージにする。'
    f'先頭行・末尾行は {MEMBER_TWIG}:236/283 の loop.first/loop.last で無効表示になりリンクを出さない。')
put('sheet-3-R042','OUT_OF_SCOPE','小見出し「削除」。要求ではない。')
put('sheet-3-R043','MATCHED',f'{MEMBER_REPO}:118-134 が削除対象より大きい sort_no を1つ繰り下げてから対象行を remove する物理削除を行う。')
put('sheet-3-R044','MATCHED',f'{MEMBER_TWIG}:332-337 がログイン中の自分自身の行では削除アイコンを無効表示にしてリンクを張らない。'
    f'{MEMBER_CTRL}:303-344 の delete に自己削除を拒否する判定は無い。')
put('sheet-3-R045','MATCHED',f'{MEMBER_CTRL}:331-335 が ForeignKeyConstraintViolationException を捕捉し、関連データがある場合はエラーにして削除しない。')
put('sheet-3-R046','OUT_OF_SCOPE','小見出し「操作の判定順序」。要求ではない。')
put('sheet-3-R047','OUT_OF_SCOPE','表の見出し行。要求ではない。')
put('sheet-3-R048','MATCHED',f'{MEMBER_CTRL}:247/276/305 が各操作の先頭で isTokenValid を呼び、不正な要求を拒否して以降を実行しない。')
put('sheet-3-R049','MATCHED',f'{MEMBER_CTRL}:245/274 の up/down は経路パラメータからメンバーを解決するため、存在しないIDでは404になる。')
put('sheet-3-R050','DRIFT','削除対象が存在しないときの扱いが設計と違う。',
    重要度='P3',指摘区分='実装違い',乖離種別='ふるまい',
    設計根拠_引用='存在しなければ削除警告を表示し、一覧へ戻る。404 にはしない。',
    設計期待値='削除で対象メンバーが存在しないときは、削除警告を表示して一覧へ戻すこと。404 にはしないこと。',
    実装参照=f'{MEMBER_CTRL}:302-344',
    実装実態='削除も経路パラメータからメンバーを解決するため、存在しないIDでは警告を表示せず404になる。',
    判定根拠=f'{MEMBER_CTRL}:302-303 の delete は引数で Member を受け取り、解決できない場合は本体に入る前に404となる。削除警告を出す分岐は実装に存在しない。')
put('sheet-3-R051','MATCHED',f'{MEMBER_CTRL}:260/264/289/293/328/335/340 が成功・失敗のメッセージを出し、同:267/296/343 で一覧へ戻る。')
put('sheet-3-R052','OUT_OF_SCOPE','小見出し「他機能との境界」。要求ではない。')
put('sheet-3-R053','OUT_OF_SCOPE','他シート（M11-02／M11-03）を正とする旨の記述で、本シートの実装要求ではない。')
put('sheet-3-R054','OUT_OF_SCOPE','金額集計・税率計算・入力検証を行わない旨の記述で、実装すべき要求ではない。')
put('sheet-3-R055','OUT_OF_SCOPE','表の見出し行。要求ではない。')
put('sheet-3-R056','MATCHED',f'{MEMBER_CTRL}:61（一覧表示）・245（上へ）・274（下へ）・303（削除）が設計の入力に対応する。')
put('sheet-3-R057','MATCHED',f'{MEMBER_CTRL}:267/296/343 が一覧へ戻り、同:260/289/328 が完了メッセージを出す。')
put('sheet-3-R058','DRIFT','失敗時出力のうち、削除対象不在時の警告メッセージが出ない。',
    重要度='P3',指摘区分='実装違い',乖離種別='ふるまい',
    設計根拠_引用='削除・上へ・下への失敗メッセージ、削除対象不在時の警告メッセージ、正当でない要求へのアクセス拒否、上へ・下へでの 404',
    設計期待値='削除で対象メンバーが存在しないときは、削除警告を表示して一覧へ戻すこと。404 にはしないこと。',
    実装参照=f'{MEMBER_CTRL}:302-344',
    実装実態='削除も経路パラメータからメンバーを解決するため、存在しないIDでは警告を表示せず404になる。',
    判定根拠=f'失敗メッセージ・アクセス拒否・上へ下へでの404は実装されているが、削除対象不在時の警告だけが無い（{MEMBER_CTRL}:302-303 で404になる）。R050 と同一の実装実態。')
put('sheet-3-R059','OUT_OF_SCOPE','小見出し「入出力: 永続化」。要求ではない。')
put('sheet-3-R060','MATCHED',f'{MEMBER_REPO}:118-134 が対象行の削除と、削除後の表示順の繰り下げを行う。同:44-83 の up/down が表示順を更新する。')
put('sheet-3-R061','OUT_OF_SCOPE','表の見出し行。要求ではない。')
put('sheet-3-R062','MATCHED',f'{MEMBER_CTRL}:318 の削除操作が {MEMBER_REPO}:116 の削除を呼ぶ。')
put('sheet-3-R063','MATCHED',f'{MEMBER_CTRL}:250/279 と {MEMBER_REPO}:44-83/118-124 が上へ・下へ・削除後の繰り下げで表示順を更新する。')
put('sheet-3-R064','MATCHED',f'{MEMBER_CTRL}:303-344 と {MEMBER_REPO}:116-135 は所属マスタ・権限マスタ・稼働マスタを更新しない。')

msg_rows = {
 'sheet-3-R065':('並び順を更新しました', f'{MSG}:1602 admin.common.move_complete と {MEMBER_CTRL}:260'),
 'sheet-3-R066':('並び順の更新に失敗しました', f'{MSG}:1603 admin.common.move_error と {MEMBER_CTRL}:264'),
 'sheet-3-R067':('並び順を更新しました', f'{MSG}:1602 admin.common.move_complete と {MEMBER_CTRL}:289'),
 'sheet-3-R068':('並び順の更新に失敗しました', f'{MSG}:1603 admin.common.move_error と {MEMBER_CTRL}:293'),
 'sheet-3-R069':('削除しました', f'{MSG}:1597 admin.common.delete_complete と {MEMBER_CTRL}:328'),
 'sheet-3-R070':('関連するデータがあるため「%name%」を削除できませんでした', f'{MSG}:1599 admin.common.delete_error_foreign_key と {MEMBER_CTRL}:334'),
 'sheet-3-R071':('削除に失敗しました', f'{MSG}:1598 admin.common.delete_error と {MEMBER_CTRL}:339'),
 'sheet-3-R072':('メンバーを削除してよろしいですか？', f'{MSG}:3239 delete__confirm_message と {MEMBER_TWIG}:362'),
 'sheet-3-R073':('メンバーを削除します。', f'{MSG}:3238 delete__confirm_title と {MEMBER_TWIG}:354'),
 'sheet-3-R074':('保存しました', f'{MSG}:1595 admin.common.save_complete と {MEMBER_CTRL}:131'),
 'sheet-3-R075':('保存に失敗しました', f'{MSG}:1596 admin.common.save_error と {MEMBER_CTRL}:133'),
 'sheet-3-R076':('保存しました', f'{MSG}:1595 admin.common.save_complete と {MEMBER_CTRL}:230'),
 'sheet-3-R077':('保存に失敗しました', f'{MSG}:1596 admin.common.save_error と {MEMBER_CTRL}:232'),
 'sheet-3-R078':('保存に失敗しました', f'{MSG}:1596 admin.common.save_error と {MEMBER_CTRL}:235'),
 'sheet-3-R079':('英数字をそれぞれ1種類使用してください。', f'{VAL}:62 form_error.password_pattern_invalid と {MEMBER_TYPE}:91-94'),
 'sheet-3-R080':('店舗が選択されていません。', f'{MSG}:3925 enterprise.form.type.member.tenant_not_selected と {MEMBER_TYPE}:188'),
 'sheet-3-R081':('半角英数字で入力してください。', f'{VAL}:39 form_error.graph_only と {MEMBER_TYPE}:204-207'),
 'sheet-3-R082':('非稼働に変更することはできません。', f'{MSG}:3246 work_can_not_change と {MEMBER_TYPE}:246'),
 'sheet-3-R083':('このログインIDは利用できません。', f'{MSG}:3926 member_already_exists と {MEMBER_TYPE}:251'),
 'sheet-3-R084':('form_error.authority_guest', f'{MEMBER_TYPE}:106-109 が同じキーでエラーを出す'),
 'sheet-3-R085':('form_error.authority_customer', f'{MEMBER_TYPE}:110-113 が同じキーでエラーを出す'),
}
for rid,(text,ev) in msg_rows.items():
    put(rid,'MATCHED',f'設計の文言「{text}」は {ev} で一致する。')

missing = [r['要求ID'] for r in reqs if r['シート'] in ('sheet-1','sheet-2','sheet-3') and r['要求ID'] not in V]
if missing:
    raise SystemExit('未判定: ' + ', '.join(missing[:10]))

with open(os.path.join(BASE,'verdicts.tsv'),'w',encoding='utf-8',newline='') as fh:
    w=csv.DictWriter(fh,fieldnames=COLS,delimiter='\t',lineterminator='\n'); w.writeheader()
    for r in reqs:
        if r['要求ID'] in V:
            w.writerow(V[r['要求ID']])
print('wrote', len(V), 'verdicts')
