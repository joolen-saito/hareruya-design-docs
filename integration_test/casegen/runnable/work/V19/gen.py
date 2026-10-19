import re,pathlib
R=pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/env')
H=["種別","対象ID","判定","区分","新しい投入方法","新しい状態・属性","根拠","理由"]
def load(n):
    ls=open(R/'in'/f'{n}.tsv',encoding='utf-8').read().split('\n')[1:]
    return [l.split('\t') for l in ls if l]
# decisions keyed by seed id: (判定,区分,新方法,新状態,根拠,理由)
D={}
def no(sid,cat,reason): D[sid]=('解消しない',cat,'','','',reason)
def yes(sid,cat,new,basis,state=''): D[sid]=('環境で解消',cat,new,state,basis,'')

S3='ec-cube-enterprise script/ops/imgcheck/bigfilefinder.sh'
# B16-11
run_old=[c for c in load('B16-11') if c[1]=='S-B16-11-RUN'][0][3]
run_new=run_old.split('未確定:')[0]+'試験環境のバッチ設定、実行コンソール設定およびアプリケーション設定で、B16-11の画像サイズチェック用スクリプトを、スケジュールの時刻を待たずにバッチ実行環境のシェルから任意の時点で起動でき、終了まで待てるようにし、試験者に起動と実行結果（標準出力と終了コード）参照の権限を付ける。'
yes('S-B16-11-RUN','バッチ',run_new,'bigfilefinder.sh（引数なしで直接実行でき、標準出力に :empty / :not empty を出して終了する）、config.sh（差出人・宛先・CC・公開URLの先頭部分・バケット名を環境で与える）、確定済み S-B02-05-BATCH-ENV の書き方')
yes('S-B16-11-BCC','バッチ・メール','メール試験サーバーの管理画面で、BCCの宛先 r9y9k6q2h2i8d9b5@sekappy-dev.slack.com のメールボックスを用意し、受信履歴を消去する。試験環境のバッチ設定、実行コンソール設定およびアプリケーション設定で、バッチB16-11の設定のBCCの項目に r9y9k6q2h2i8d9b5@sekappy-dev.slack.com を与えてからバッチを起動する（差出人・宛先・CCを設定で与えるのと同じ方法）。','bigfilefinder.sh:85-98（BCCを設定で与え、sendmailで送る）、config.sh（BCCは環境で上書きできる）、確定済み S-B16-11-MAIL（同じメール試験サーバーに通知先のメールボックスを用意する書き方）')
no('S-B16-11-SCHED-013','時刻・バッチ','試験環境の時刻を進める手段が必要（時刻の固定・操作は用意しない）。15分毎の自動起動を実時間で待つ前提にもできず、スケジュール起動の定義も実装に無い')
for i,why in [('MAILFAIL-033','メール送信を失敗にする手段が要る（障害を起こす手段は用意しない）'),('SUBJFAIL-041','件名生成（文字コード変換・日時取得）を失敗にする手段が要る（障害を起こす手段は用意しない）'),('SPLITFAIL-042','商品サムネイルとオリジナル画像の切り分けを異常終了させる手段が要る（障害を起こす手段は用意しない）'),('SPLITFAIL-043','商品サムネイルとオリジナル画像の切り分けを異常終了させる手段が要る（障害を起こす手段は用意しない）'),('JUDGEFAIL-044','規定サイズの判定を異常終了させる手段が要る（障害を起こす手段は用意しない）'),('JUDGEFAIL-045','規定サイズの判定を異常終了させる手段が要る（障害を起こす手段は用意しない）')]:
    no('S-B16-11-'+i,'障害',why)
no('S-B16-11-CONCUR-048','バッチ・その他','バッチ起動用のシェルは用意できるが、シェルAの実行が、シェルBの3000件の削除と確認が終わるまで終わらないことを保証できない。スクリプトは一覧取得を数回行うだけで3000件でも数秒で終わるため、実行を引き延ばす手段（遅延・障害は用意しない）が要る')
no('S-B16-11-OVERLIST2-061','作り方','前回の実行で作られた iwatatest の一覧を作業用の保存先に作る手段が無い（刷新後のスクリプトは iwatatest の一覧を作らず、一覧は実行で作られるだけ）')
# B17-01
B=('中継・模擬・作り方','外部記事サイトの公開APIの宛先はスクリプト内の固定値で切り替える設定が無く（CreateLatestArticleListAction.php:29）、模擬APIへの差し替えと応答の作り込みが要る（中継・模擬は用意しない）。外部の試験環境として用意される記事サイトも無く、記事を指定の識別子・件数で作る手段が無い')
no('S-B17-01-ENV','中継・模擬・作り方',B[1])
for k in ['001','002','003','004','005','006','007','008','009']:
    no('S-B17-01-RESP-'+k,'中継・模擬・作り方',B[1])
for k in ['010','011']:
    no('S-B17-01-RESP-'+k,'中継・模擬・障害','外部記事サイトの公開APIへ接続できない状態を作る手段が要る（模擬APIの停止・通信の遮断は、中継・模擬と障害を起こす手段で用意しない）。宛先もスクリプト内の固定値で切り替えられない（CreateLatestArticleListAction.php:29）')
# F01-01
no('S-F01-01-VIDEO-JSON','中継・模擬・作り方','動画JSONの取得先は固定のURL（HareruyaChannelBlockPayloadBuilder.php:27、api.corp.hareruyamtg.com）で、そこへVIDEO-01〜VIDEO-04の応答を返させるには応答の差し替え（中継・模擬）が要る。切り替える設定も、その外部サイトに動画データを作る管理手段も設計書・実装に無い')
D['前提-0909fc0020']=None
# F01-02
no('S-F01-02-CASE-056','作り方','お取り寄せサービス申込みフォームURLを設定できる画面が無い（店舗設定の管理画面の入力欄と画面側の定義に当該項目が無く、実装は店舗の申込みフォームURLの値を表示側で読むだけ）。値を入れる操作がそもそも存在しない')
# F02-01
U='UniSuggestの候補は外部サービス側が持つ辞書・履歴から返り、検索語ごとの候補（キーワード・カードセット・カテゴリ）を登録・置換する操作が設計書にもeeの実装にも無い。ユニサーチフィードの送信は商品検索データを渡すだけで、候補応答まで作られることを確かめられない'
for s in ['SUGGEST-COMMON','SUGGEST-LIMIT','PURCHASE-SUGGEST','BRANCH-SUGGEST']:
    no('S-F02-01-'+s,'外部の試験環境・作り方',U)
# 前提 rows
def target(c):
    m=re.match(r'対象: ([^／]+)',c[6]); return m.group(1) if m else None
out=[]
for n in ['B16-11','B17-01','F01-01','F01-02','F02-01']:
    res=[]
    for c in load(n):
        k,i=c[0],c[1]
        if k=='シード': d=D[i]; res.append([k,i,*d])
        else:
            t=target(c)
            if i=='前提-0909fc0020':
                res.append([k,i,'解消しない','作り方','','','','カード言語を持たない「カード以外の商品」をデッキ採用枚数ランキングへ含めるデータの作り方が設計書にもeeの実装にも無い（環境の用意では解消しない）']); continue
            d=D[t]
            if d[0]=='環境で解消':
                w={'S-B16-11-RUN':'解消の書き方: 試験環境のバッチ設定、実行コンソール設定およびアプリケーション設定で、B16-11の画像サイズチェック用スクリプトをバッチ実行環境のシェルから任意の時点で起動でき、終了まで待てるようにし、試験者に起動と実行結果参照の権限を付ければ、手動起動の手段が決まる。シードS-B16-11-RUNと同じ書き方。',
                   'S-B16-11-BCC':'解消の書き方: メール試験サーバーにBCCの宛先 r9y9k6q2h2i8d9b5@sekappy-dev.slack.com のメールボックスを用意して受信履歴を消去し、バッチの設定のBCCにその宛先を与えてバッチを起動すれば、BCC宛先への受信を確かめられる。シードS-B16-11-BCCと同じ書き方。'}[t]
                res.append([k,i,d[0],d[1],w,'',d[4],''])
            else:
                res.append([k,i,d[0],d[1],'','','',d[5]])
    out.append((n,res))
for n,res in out:
    p=R/'out'/f'{n}.tsv'
    with open(p,'w',encoding='utf-8') as f:
        f.write('\t'.join(H)+'\n')
        for r in res:
            assert all('\t' not in x and '\n' not in x for x in r)
            f.write('\t'.join(r)+'\n')
    print(n,len(res),sum(1 for r in res if r[2]=='環境で解消'),sum(1 for r in res if r[2]=='解消しない'))
