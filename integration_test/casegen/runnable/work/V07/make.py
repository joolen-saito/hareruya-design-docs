import re
N="B08-07@1"
rows=[l.rstrip('\n').split('\t') for l in open(f'env/in/{N}.tsv',encoding='utf-8')][1:]
HEAD="種別\t対象ID\t判定\t区分\t新しい投入方法\t新しい状態・属性\t根拠\t理由"
MAILSENT="試験環境の受信箱で、上の各会員のメールアドレス宛のメール（仮会員登録完了メールを含む）をすべて消してから始める"
TAIL="投入後は会員ID・本人確認ステータス・身分証有効期限日が記載どおりであることをDBで確認する"
DATES="実行日の1年前・1年後・14日後・15日後の日付は投入日から計算して設定する"
BASIS=("設計書 B08-07 L0022〜L0023・L0029〜L0033（取得条件は身分証有効期限日のみ）／"
 "実装 CustomerEditController.php の会員編集（本人確認ステータスのラジオ選択）と completeIdentification（「オンライン本人確認」モーダルの身分証有効期限日を保存し、本人確認ステータスをオンライン本人確認済みにする。過去日付も可: PlayerType の範囲は1900-01-01以降）／"
 "edit.twig の「オンライン本人確認」ボタンとモーダル／IdExpireNotificationAction・DtbPlayerRepository の対象取得は本人確認ステータスで絞らない／"
 "会員の登録手順と会員IDを画面から控える書き方は A15-05 の確定済みシード（S-A15-05-SELF-001）と同じ")
def parse(s):
    out=[]
    for m in s.split('／'):
        mm=re.fullmatch(r'会員ID (\d+)・名前\(姓\)=(\S+)・名前\(名\)=(\S+)・メールアドレス=(\S+)・退会者フラグ=無効（稼働中）・本人確認ステータス=(\S+?)・身分証有効期限=(.+)',m)
        if not mm:
            return None
        out.append(mm.groups())
    return out
def member_step(i,g):
    mid,sei,mei,mail,st,exp=g
    if exp=='未設定(NULL)': e="身分証有効期限を空のまま「更新」を押す"
    else: e=f"身分証有効期限に{exp}を年-月-日の形式で入れて「更新」を押す"
    s=(f"会員{mid}: フロントの新規会員登録画面で、お名前(姓)に「{sei}」、お名前(名)に「{mei}」、フリガナ(姓)・フリガナ(名)・生年月日・郵便番号・住所(都道府県)・住所1・住所2・電話番号に入力規則を満たす値、"
       f"メールアドレスとメールアドレス(確認)に「{mail}」、パスワードとパスワード(確認)に入力規則を満たす12文字以上の値を入れて「同意する」を押し、確認画面で「登録する」を押す。"
       f"試験環境の受信箱で「{mail}」宛の仮会員登録完了メール内のURLを開き、本会員登録完了の画面が表示されることを確かめる。"
       f"管理画面の会員検索一覧でメールアドレス「{mail}」を検索し、検索結果の行に表示された会員IDを控える（〔会員ID-{mid}〕）。"
       f"その会員の会員編集画面で「オンライン本人確認」を押し、表示されたモーダルの{e}（本人確認ステータスがオンライン本人確認済みになる）")
    if st=='簡易書留確認済み':
        s+="。続けて会員編集画面の本人確認ステータスで「簡易書留確認済み」を選び「登録」を押す"
    return s
seedinfo={}
out=[HEAD]
for r in rows:
    kind,tid,col,old,state,cases,hint=r
    if kind=='シード' and tid=='S-B08-07-SENDLOG':
        res=("解消しない","メール・その他","","","設計書 B08-07 L0065〜L0066（管理者宛は会員宛の送信完了後）／sheetmap/gen_B08-07/report.md「ケースにしなかったもの」（外から順序を観測する手段が無い）",
             "用意されるメールの受信箱は宛先・件名・本文を見る手段で、送信順の記録を閲覧・消去できる保証が無い。実装にも送信順を記録する手段が無い。送信順の観測手段が決まらない")
    elif tid=='S-B08-07-SCHED':
        res=("解消しない","バッチ・時刻","","","設計書 B08-07 L0026（毎日8:00のスケジュール起動）","環境の時刻を7:59へ合わせて翌日まで進める手段が要る（時刻の固定・操作は用意しない）。実時間で8:00を待つ運用は決まっていない")
    elif tid=='S-B08-07-STAT-022':
        res=("解消しない","作り方","","","実装 CustomerEditController.php（本人確認ステータスが未確認以外から未確認へ変わると身分証有効期限を空にする）と completeIdentification（常にオンライン本人確認済みにする）","会員807022001は本人確認ステータス=未確認で身分証有効期限が入った状態。管理画面の操作ではその状態を作れず（未確認にすると期限が消える）、画面から値を指定して入れる手段も無い")
    elif kind=='前提':
        sid=re.search(r'対象: (S-[\w-]+)',hint).group(1)
        if sid in ('S-B08-07-SENDLOG','S-B08-07-SCHED','S-B08-07-STAT-022'):
            why={'S-B08-07-SENDLOG':"送信順の記録を閲覧・消去する手段が受信箱の機能に含まれない",
                 'S-B08-07-SCHED':"環境の時刻を進める手段は用意しない",
                 'S-B08-07-STAT-022':"未確認で身分証有効期限が入った会員を画面操作で作れない"}[sid]
            cat={'S-B08-07-SENDLOG':'メール・その他','S-B08-07-SCHED':'バッチ・時刻','S-B08-07-STAT-022':'作り方'}[sid]
            res=("解消しない",cat,"","",f"{sid}の判定と同じ",why+f"（{sid}と同じ理由）")
        else:
            res=("環境で解消","メール",f"{sid}の投入方法のとおり、フロントの新規会員登録画面と受信箱（メール）で会員を登録し、管理画面の会員編集画面（「オンライン本人確認」のモーダルと本人確認ステータスの選択）で本人確認ステータスと身分証有効期限日を設定すれば、この前提は満たされる。","",BASIS,"")
        # 区分: 環境で解消のときは環境の語のみ
        if res[0]=="環境で解消": res=(res[0],"メール")+res[2:]
    else:
        g=parse(state)
        assert g,tid
        steps="。".join(member_step(i,x) for i,x in enumerate(g))
        new=f"{steps}。{DATES}。{MAILSENT}。{TAIL}"
        ns=state
        for x in g:
            ns=ns.replace(f"会員ID {x[0]}・",f"会員ID は登録時に画面が振る（控える。以下〔会員ID-{x[0]}〕）・")
        res=("環境で解消","メール",new,ns,BASIS,"")
    out.append("\t".join([kind,tid,*res]))
    assert all('\t' not in c and '\n' not in c for c in res)
open(f'env/out/{N}.tsv','w',encoding='utf-8').write("\n".join(out)+"\n")
