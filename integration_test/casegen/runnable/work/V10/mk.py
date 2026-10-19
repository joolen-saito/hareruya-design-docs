import re
R="/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/"
rows=[l.rstrip('\n').split('\t') for l in open(R+'env/in/B16-06.tsv',encoding='utf-8')][1:]
CLOUD="試験環境で本番クラスタの代わりにするクラスタ・スナップショット・S3バケット・RDS/EC2の参照権限といったAWSの資源そのものを用意する必要がある（用意できるのはバッチを動かす手段であり、本番相当のクラウド基盤ではない）"
M={
'ENV':('その他・設計',CLOUD+"。リニューアル後の環境でのスナップショット検索名も設計書に定めが無い（L0023）",'script/ops/monthly-inventory-snapshot/inventory.sh のスナップショット取得・復元・S3送信、設計書 sheet-8 L0022-L0023・L0047'),
'ALLSTORES-008':('作り方・設計',"本店・支店の区別を店舗にどう持たせるかが設計書（L0017・L0034は全店舗出力に統一とのみ）に無く、登録方法が決まらない。登録後のスナップショットもAWS資源の用意（S-B16-06-ENV）が残る",'設計書 sheet-8 L0017・L0034'),
'SCHEDULE-011':('時刻',"スケジュール起動（毎月1日 午前1時）の時刻を試験で進める必要があり、時刻の固定・操作は用意しない",'設計書 sheet-8 L0049'),
'ORDERFLOW-013':('設計・その他',"バッチの標準出力の保存先と参照手段が設計書に無い。参照するための権限・AWS資源の用意（S-B16-06-ENV）も残る",'inventory.sh の log 関数（標準出力のみ）'),
'EC2ENV-014':('設計・その他',"バッチ処理用EC2インスタンスの識別名と実行状況の確認手段が設計書に無い（L0019は名称のみ）。AWS資源の用意（S-B16-06-ENV）も残る",'設計書 sheet-8 L0019'),
'NOPRODCL-017':('設計・その他',"AWSの操作記録の参照権限と手段が設計書にもee実装にも無い。AWS資源の用意（S-B16-06-ENV）も残る",'inventory.sh の必須設定チェック'),
'MULTISG-019':('その他',"セキュリティグループ2つ（B1606-019-SGA・SGB）をAWS上に作る必要があり、これはバッチを動かす手段ではなくクラウド資源そのもの",'inventory.sh の VPC_SG_ARR'),
'AVAIL-020':('作り方・時刻',"作成中のスナップショットを実行時点で残すには、作成のタイミングを狙う必要があり、手順が無い（時刻の制御は用意しない）。AWS資源の用意（S-B16-06-ENV）も残る",'inventory.sh のスナップショット選択（Status==available）'),
'NOSNAP':('その他',"スナップショットが0件の本番クラスタをAWS上に作る必要があり、クラウド資源そのものの用意になる",'inventory.sh の ERROR: スナップショットが見つかりません'),
'UNAVAIL':('障害',"一時インスタンスが利用可能にならない状態を意図的に起こす手段が要る（障害を起こす手段は用意しない）",'inventory.sh のインスタンス待機ループ'),
'STATUSNA-029':('障害',"状態の取得だけを一時的に失敗させる手段が要る（障害を起こす手段は用意しない）",'inventory.sh のインスタンス待機ループ'),
'ENDPOINT-03':('中継・模擬',"接続先の取得結果だけを空にするには、AWSの応答の差し替え（中継・模擬）が要る。利用可能な一時クラスタは接続先を持つ",'inventory.sh の PGHOST 取得'),
'NOSTORE-034':('作り方',"商品在庫が存在しない店舗を指す状態を作る手段が設計書にも実装の確認範囲にも無い。AWS資源の用意（S-B16-06-ENV）も残る",'設計書 sheet-8 L0077'),
'EXTERR':('障害',"一時DBへの抽出クエリを異常終了させる手段が要る（障害を起こす手段は用意しない）",'inventory.sh の psql ON_ERROR_STOP'),
'UPLOADNG-043':('障害',"アップロードだけを失敗させる手段が要る（障害を起こす手段は用意しない）",'inventory.sh の aws s3 cp'),
'CLEANWORK-044':('設計・その他',"作業場所のパスと確認手段が設計書にもee実装にも無い（実装は実行ディレクトリに出力するのみ）",'inventory.sh の OUT/ZIP'),
'KEEPWORK-045':('障害・設計',"アップロードだけを失敗させる手段が要り、作業場所の確認手段も設計書に無い",'inventory.sh の aws s3 cp・OUT/ZIP'),
'OTHERRES-047':('その他',"別のクラスタ・インスタンスをAWS上に作る必要があり、クラウド資源そのものの用意になる",'inventory.sh の TMP_CLUSTER_ID/TMP_INSTANCE_ID'),
'DELFAIL-050':('障害',"一時DBの削除だけを失敗させる手段が要る（障害を起こす手段は用意しない）",'inventory.sh の cleanup'),
'ENGVER-057':('設計・その他',"試験環境の本番クラスタのエンジンのバージョンが設計書に無く、値を決めるには試験用の本番クラスタの用意（クラウド資源）が先に要る",'config.sh の DB_ENGINE_VERSION'),
'EPFAIL-059':('中継・模擬',"接続先の取得の処理だけを既知のエラーで失敗させるには、AWSの応答の差し替え（中継・模擬）が要る",'inventory.sh の PGHOST 取得'),
'EXTERRNOUP-060':('障害',"一時DBへの抽出クエリを異常終了させる手段が要る（障害を起こす手段は用意しない）",'inventory.sh の psql ON_ERROR_STOP'),
'ERRDELFAIL-061':('中継・模擬・障害',"接続先の取得結果を空にする（中継・模擬）と、削除だけを失敗させる（障害）の両方が要る",'inventory.sh の PGHOST 取得・cleanup'),
'PORT-063':('その他',"本番クラスタの代わりのクラスタをポート45063で作り、セキュリティグループの受信を許可するクラウド資源の用意が要る（バッチは復元時にポートを指定しない）",'inventory.sh の restore-db-cluster-from-snapshot・config.sh の PGPORT'),
'ENDPOINTNONE-06':('その他・中継・模擬',"本番クラスタ代替の用意（クラウド資源）に加え、接続先の取得結果だけを該当なしにするAWS応答の差し替え（中継・模擬）が要る",'inventory.sh の PGHOST 取得'),
'UPLOADLOG-066':('その他',"本番クラスタの代わりにするクラスタ・スナップショット取得権限の用意（クラウド資源）が残る。アップロード出力自体は追加の投入が要らない",'inventory.sh の aws s3 cp'),
}
pre={}
for r in rows:
    pre[r[1]]=r
out=["種別\t対象ID\t判定\t区分\t新しい投入方法\t新しい状態・属性\t根拠\t理由"]
cur=None
for r in rows:
    if r[0]=='シード':
        cur=r[1].replace('S-B16-06-','')
    key=next((k for k in M if cur==k or cur.startswith(k)),None)
    cat,why,ev=M[key]
    out.append("\t".join([r[0],r[1],"解消しない",cat,"","",ev,why]))
open(R+'env/out/B16-06.tsv','w',encoding='utf-8').write("\n".join(out)+"\n")
print(len(out)-1)
