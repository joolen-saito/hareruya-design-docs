import csv,sys
csv.field_size_limit(10**9)
R='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/env/'
def rows(n):
    return [l.rstrip('\n').split('\t') for l in open(R+'in/'+n+'.tsv',encoding='utf-8')][1:]
H="種別\t対象ID\t判定\t区分\t新しい投入方法\t新しい状態・属性\t根拠\t理由"
def w(n,res):
    out=[H]
    for r in rows(n):
        v=res(r)
        out.append("\t".join([r[0],r[1],*v]))
    open(R+'out/'+n+'.tsv','w',encoding='utf-8').write("\n".join(out)+"\n")
NO=lambda cat,basis,why:("解消しない",cat,"","",basis,why)
# B08-07@3
def f3(r):
    return NO("作り方","design.txt B08-07 L0087-L0088（対象は身分証有効期限日で決まる）／ee CustomerEditController.php（管理画面の会員編集）・PlayerType.php（本人確認ステータス・身分証有効期限は設定できるが会員IDの入力欄は無い）",
      "会員IDを807057001のように指定して会員を作る手段が無い（会員IDは自動採番で、バッチ・外部の試験環境・メールでは解消しない）。ケースの手順・期待結果が会員IDの値でDBを開いて確認するため、控えた番号への置き換えも設計の変更になる" if '057' in r[1] or 'e274' in r[1] else
      "会員IDを807058001のように指定して会員を作る手段が無い（会員IDは自動採番で、バッチ・外部の試験環境・メールでは解消しない）。ケースの期待結果が会員ID指定の会員を前提にしているため、控えた番号への置き換えは設計の変更になる")
w('B08-07@3',f3)
# B13-01
EX_ENV=("試験環境のバッチ設定、実行コンソール設定およびアプリケーション設定で、バッチB13-01（決済処理中チェック。実行コンソールでeccube:payment-status-checkを入力引数なしで起動する）の参照先を専用試験DBに設定し、業務時刻帯をJSTにし、試験者へ起動・実行結果参照の権限を付ける。起動前に実行コンソールでB13-01の実行中件数が0件であることを確認し、起動した実行の出力（先頭に実行日時つき）と終了コードで結果を確認する。")
EX_BASIS="PaymentStatusCheckCommand.php:30（コマンド名eccube:payment-status-check・引数なし・出力の先頭に実行日時）、B13-01 design.txt L0017・L0065-L0067、B02-02の確定済み前提（前提-718971a356）の書き方"
def f13(r):
    t,i=r[0],r[1]
    if i=='S-B13-01-EXEC':
        return ("環境で解消","バッチ",EX_ENV,"",EX_BASIS,"")
    if i in('前提-2b471eda49','前提-83dc3a7549','前提-b36e5a95e5'):
        return ("環境で解消","バッチ","解消の書き方: 試験環境のバッチ設定、実行コンソール設定およびアプリケーション設定で、バッチB13-01（実行コンソールでeccube:payment-status-checkを入力引数なしで起動）の参照先を専用試験DBに設定し、試験者へ起動・実行結果参照の権限を付ければ、手動起動と専用試験DBでの実行が決まる。同じ中身のシードS-B13-01-EXECと同じ書き方。","",EX_BASIS,"")
    if i in('S-B13-01-API','前提-cd3a7eba70','前提-e7fb6a7237','前提-7f68176a40'):
        return NO("中継・模擬","precond/open_preconditions.tsv S-B13-01-API／B13-01 design.txt L0031-L0044・L0048","支払番号ごとにK02〜K99の取引照会エラー、取引不在・未完了、接続エラーを返させ、要求履歴を取る必要がある（外部の応答の差し替え・エラー応答・通信の記録は用意しない。外部の試験環境は本物のふるまいしかしない）")
    if i in('S-B13-01-MAIL','前提-7899e507dc','前提-c7159e40be','前提-619253830f'):
        return NO("障害","precond/open_preconditions.tsv S-B13-01-MAIL／B13-01 design.txt L0060・L0069","指定した会員宛てだけメール送信を失敗させる手段が要る（送信の失敗を起こす障害は用意しない。受信箱の確認・消去だけならメールで足りるが、同じ項目に送信エラーが含まれる）")
    if i=='前提-a43174705b':
        return NO("時刻","ee PaymentStatusCheckAction（実行時の現在日時から30分前を算出）","システム時刻を2026-09-04 10:20:00に固定する必要がある（時刻の固定は用意しない）")
    if i in('S-B13-01-MAIL-FAIL-CONTINUE-015','S-B13-01-MAIL-FAIL-CONTINUE-016'):
        return NO("障害・中継・模擬","B13-01 design.txt L0060","前者の会員宛てだけメール送信を失敗させる手段（障害は用意しない）と、申込ごとにOK応答を返させる取引照会の制御（外部の応答は作り変えられない）が要る")
    if i.startswith('S-B13-01-API-ERROR') or i=='S-B13-01-ERRAPI-035':
        return NO("中継・模擬","B13-01 design.txt L0048-L0049・L0069","取引照会でSP.LINKS接続エラー／支払番号ごとに内容の異なる想定外エラーを返させる必要がある（エラー応答を返す仕組み・外部の応答の差し替えは用意しない）")
    if i=='前提-161eafb226':
        return NO("中継・模擬","同上 S-B13-01-ERRAPI-035","支払番号ごとに内容の異なる2種類の想定外エラーを返させる必要がある（エラー応答を返す仕組みは用意しない）")
    raise SystemExit("?"+i)
w('B13-01',f13)
