import csv
def rows(n):
    L=open(f'env/in/{n}.tsv',encoding='utf-8').read().split('\n')
    return [l.split('\t') for l in L[1:] if l.strip()]
R={
'S-B08-04-FIELDNN-002':('作り方','名前(姓)・名前(名)・メールアドレスは列が未設定を受け付けない制約であり、制約の一時解除は環境（バッチ・外部の試験環境・メール）では用意されない','design.txt 現行仕様 L0090 空欄判定／ENV_PROMPT 判定表','未設定を保存できる投入手段が要る（バッチ・外部の試験環境・メールでは解消しない）'),
'前提-10cce43bad':('作り方','同左','同左','同左（S-B08-04-FIELDNN-002と同じ）'),
'S-B08-04-SCHED':('時刻・作り方','','design.txt B08-04 スケジュール起動','環境の時刻を4:04へ合わせて進める手段が要る（時刻の固定・変更は用意しない）'),
'前提-35ec13c1a9':('時刻・作り方','','同左','同左（S-B08-04-SCHEDと同じ）'),
'S-B08-04-EXT':('設計・中継・模擬','','design.txt L0106 外部APIを呼び出さない','連携先の一覧が設計書に無い。各外部連携先の受信履歴を取る手段は通信の記録（中継・模擬は用意しない）'),
'前提-1c5ce40844':('設計・中継・模擬','','同左','同左（S-B08-04-EXTと同じ）'),
'S-B08-04-CMD':('設計','','design.txt L0092・L0098・L0103／ee src/Eccube/Command/CheckBlankRequiredItemCustomerCommand.php','eeの実装にはコマンド名の入力が無く（固定名の起動のみ）、未指定・不一致の挙動を作る起動操作が設計にも実装にも無い'),
'前提-b4529ba97d':('設計','','同左','同左（S-B08-04-CMDと同じ）'),
'S-B08-06-API-CONTROL':('中継・模擬','','precond/open_preconditions.tsv','ポイント増減要求だけを通信遮断・指定JSON応答へ切り替える中継が要る（中継・模擬は用意しない。外部の応答は作り変えられない）'),
'前提-cb54eeca00':('中継・模擬','','同左','同左'),
'前提-7ef5a7a9d1':('設計','','ee src/Eccube/Command/SmaregiUpdatePointCommand.php／機能設計書 起動契機','再処理から切り離して起動される連携の終了を識別する方法が設計書にもee実装にも定まっていない（バッチの終了を待つ手段では識別できない）'),
'前提-7ae32985e6':('中継・模擬','','同左','同左（S-B08-06-API-CONTROLと同じ）'),
}
for n in ['B08-04','B08-06']:
    out=['\t'.join('種別 対象ID 判定 区分 新しい投入方法 新しい状態・属性 根拠 理由'.split())]
    for r in rows(n):
        k,t=r[0],r[1]; c=R[t]
        out.append('\t'.join([k,t,'解消しない',c[0],'','',c[2],c[3]]))
    open(f'env/out/{n}.tsv','w',encoding='utf-8').write('\n'.join(out)+'\n')
