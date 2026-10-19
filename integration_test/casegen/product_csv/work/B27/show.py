import sys
f=sys.argv[1]
ls=[l.rstrip("\n").split("\t") for l in open(f"in/{f}.tsv")]
h=ls[0]
for r in ls[1:]:
    print("=====",r[0], "| ケース:", r[-1])
    print("[論理名]",r[2]); print("[属性]",r[3]); print("[用途]",r[4]); print("[投入]",r[5]); print("[共有]",r[6])
