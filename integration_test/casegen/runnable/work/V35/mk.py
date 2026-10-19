import csv,sys
base="integration_test/casegen/runnable/env/"
def cls(r):
    k,i,txt=r["種別"],r["対象ID"],r["今の文"]
    if "PRINT" in i or "印刷の要求が記録される先" in txt:
        return "その他・作り方","試験端末のWindows印刷キューと、試験で使うプリンター（実機か仮想か）を用意する必要があり、バッチ・外部の試験環境・メールのいずれでも決まらない"
    if "READ" in i or "カード読み取り" in txt[:20]:
        return "その他・作り方","端末の照合データへ試験用カードを入れる手段とカメラへの映し方（実機か仮想カメラか）が未確定。端末のファイル操作・カメラ入力でありバッチ・外部の試験環境・メールでは決まらない"
    if "TERM" in i or "ID-" in i:
        w="査定途中データの置き場所" if "TERM" in i else "身分証画像の保管場所と暗号化の形式"
        return "その他・作り方",f"端末内の{w}が未整備で、端末のファイルを直接操作する手段が要る。バッチ・外部の試験環境・メールでは決まらない"
    if "RELAY" in i or "8bb76e7f85" in i or "5de830020a" in i or "40dce5b9f4" in i or "32e6b1b2ff" in i or "f01151dac7" in i or "d698cd7a34" in i or "ENV" in i:
        return "中継・模擬・その他","アプリとECCUBE・ファイル保管先の間の通信の記録・切断・応答の置き換えをする中継が要る（中継・模擬は用意しない）。あわせて端末へのMTGバイヤー配置と接続先設定も未整備"
    if "STORE" in i or "7d61673b9d" in i or "38883519c3" in i:
        return "その他・作り方","試験用のファイル保管先（クラウドの資源）と端末内の査定途中データの置き場所が未整備。バッチ・外部の試験環境・メールの用意では決まらない"
    if "FILE" in i:
        return "中継・模擬・その他","中継がそのまま転送する状態を前提にした端末A・Bの操作で、試験用保管先と端末内の置き場所が未整備（中継・模擬は用意しない）"
    return "その他","未確定が残る"
for n in sys.argv[1:]:
    rows=list(csv.DictReader(open(base+f"in/{n}.tsv",encoding="utf-8"),delimiter="\t",quoting=csv.QUOTE_NONE))
    out=["\t".join(["種別","対象ID","判定","区分","新しい投入方法","新しい状態・属性","根拠","理由"])]
    for r in rows:
        c,why=cls(r)
        out.append("\t".join([r["種別"],r["対象ID"],"解消しない",c,"","","",why]))
    open(base+f"out/{n}.tsv","w",encoding="utf-8").write("\n".join(out)+"\n")
    print(n,len(rows))
