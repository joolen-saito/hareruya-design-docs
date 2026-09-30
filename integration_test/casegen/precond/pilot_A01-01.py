#!/usr/bin/env python3
"""A01-01 の前提条件を書き直す（試作 第2版）。基線から読み、ケース・シード・改名表・手順変更表を書く。

期待結果は基線に改名を当てるだけで作る（手で書かない）。
データの作り方は設計書（0501 スマレジ連携処理）に無いものを ee 実装から引いた。
物理名（環境変数・テーブル・ルート名）は書かない（論理名規約）。
"""
import csv, pathlib, sys

PC = pathlib.Path(__file__).resolve().parent
CG = PC.parent
FID = "A01-01"
sys.path.insert(0, str(PC))
from gate_precond import apply  # noqa: E402

ADM = "管理画面に、店舗ID 1に所属する試験管理者でログインしている（S-A01-01-ADM）"
ENV = ("ECCUBEがスマレジ試験環境へ接続でき、店舗ID 1がスマレジ試験環境の店舗に対応付けられ、"
       "スマレジからのWebhookがECCUBEの/smaregi/stocksへ届き、非同期処理が動いている。"
       "本機能で「商品ID SMA-…」はスマレジ試験環境に商品コードSMA-…で登録した商品を指す（S-A01-01-ENV）")
RELAY = ("スマレジとECCUBEの間の通信は中継を通る。中継はWebhookと一括処理の要求・応答・結果通知を記録し、"
         "結果通知を保留して試験者の操作で転送、または内容を指定して送信できる。ケース開始時に中継の記録を区切り、前のケースが残した保留中の結果通知を破棄する（S-A01-01-RELAY）")
CSVIN = ("在庫変更CSV登録画面では店舗=店舗ID 1、在庫場所=スマレジ、変更理由区分=選択肢の先頭、承認部署=A01-01試験部署、"
         "在庫変更理由=A01-01結合テスト、承認通知先=試験管理者を入力する（S-A01-01-CSVFORM）")
MAKE = ("スマレジ試験環境の管理画面で商品コードを付けて商品を登録し、在庫を設定する。"
        "スマレジ商品連携でECCUBEの商品に対応付ける。ECCUBE側の在庫場所スマレジの在庫はDB投入で作る"
        "（管理画面の在庫編集はスマレジ連携が走るので使わない）")
MAKE_CSV = "CSVフィクスチャ（列=商品コード・在庫増減数）を作る。商品は" + MAKE


def sm(pid, n, tail=""):
    return (f"商品ID {pid}が、ECCUBEの店舗ID 1・在庫場所スマレジの在庫{n}、"
            f"スマレジ試験環境の在庫{n}で登録されている{tail}")


def row(sid, kind, name, attr, use, how, share):
    return (sid, kind, name, attr, use, how, share)


SEEDS = [
    row("S-A01-01-ADM", "管理者", "A01-01試験管理者",
        "ログインID=a0101_admin／パスワード=Passw0rd!A0101／在庫管理機能を操作できる／所属店舗=店舗ID 1／所属部署=A01-01試験部署／在庫の承認権限を持つ",
        "管理画面操作。どのケースもログイン失敗やロックを起こさない",
        "管理画面のメンバー管理で試験開始前に登録する。部署A01-01試験部署を作って所属させ、在庫の承認権限を拒否していない権限を付ける", "共有可"),
    row("S-A01-01-ENV", "環境設定", "スマレジ連携環境",
        "ECCUBEのスマレジ接続設定（契約ID・API認証）がスマレジ試験環境を向く／店舗ID 1の基本設定にスマレジ試験環境の店舗IDを設定／"
        "スマレジ試験環境のWebhook送信先=ECCUBEの/smaregi/stocks、スマレジの送信元IPがECCUBEの許可IPに入り、Webhookの共有シークレットが両側で一致／"
        "非同期処理のワーカーが起動している／商品ID SMA-…はスマレジ試験環境で商品コードSMA-…として登録した商品を指す",
        "全ケースの共通環境。どのケースも設定を変えない",
        "試験環境構築時に、ECCUBEの環境設定と管理画面の店舗設定、スマレジ試験環境のWebhook設定で行う", "共有可"),
    row("S-A01-01-RELAY", "環境設定", "スマレジ通信の中継",
        "スマレジとECCUBEの間のWebhook・一括処理の要求と応答・結果通知を記録する／結果通知を保留し、試験者の操作で転送または内容を指定して送信できる",
        "Webhook応答の観測、コールバック前の状態確認、成功・エラー結果の送り分け。保留・転送の設定、記録の区切り、残った保留通知の破棄は各ケースが開始時に自分で行う",
        "試験環境構築時に用意する（未整備。open_preconditions.tsv 参照）", "共有可"),
    row("S-A01-01-CSVFORM", "画面入力値", "在庫変更CSV登録の入力値",
        "店舗=店舗ID 1／在庫場所=スマレジ／変更理由区分=選択肢の先頭／承認部署=A01-01試験部署／在庫変更理由=A01-01結合テスト／承認通知先=試験管理者（S-A01-01-ADM）",
        "在庫変更CSV登録を使うケースの共通入力値", "入力値の取り決めのため投入不要", "共有可"),
]
for n in ("001", "002", "003"):
    SEEDS.append(row(f"S-A01-01-SALE-{n}", "商品・在庫", f"Webhook売上用商品({n})",
                     f"商品ID=SMA-A01-001-{n}／店舗ID=1／ECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10／店頭受取分ではない",
                     f"IT-A01-01-{n}専用。スマレジで2個販売する", MAKE, "ケース専用"))
SEEDS += [
    row("S-A01-01-RETURN-004", "商品・在庫・取引", "Webhook返品用商品と販売取引",
        "商品ID=SMA-A01-002-004／店舗ID=1／ECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10／"
        "事前準備でスマレジから2個販売した取引を作り、両側の在庫=8にしてから始める",
        "IT-A01-01-004専用。販売した取引を全キャンセルする",
        MAKE + "。販売取引はスマレジ試験環境のレジで店舗ID 1に対応する店舗を選んで作る", "ケース専用"),
    row("S-A01-01-OTHER-DIVISIONS-005", "商品・在庫", "反映対象外在庫区分用商品",
        "商品ID=SMA-A01-O01〜SMA-A01-O15の15商品／店舗ID=1／各ECCUBE在庫場所スマレジの在庫=10／各スマレジ在庫=10",
        "IT-A01-01-005専用。15商品に在庫区分01、03〜10、13〜18の在庫変動を1件ずつ起こす", MAKE, "ケース専用"),
    row("S-A01-01-PICKUP-006", "受注・商品・在庫", "店頭受取分の商品",
        "店頭受取の受注1件と、その受注に対応してスマレジ試験環境にある商品（本ケースでは商品ID SMA-A01-PICKUPと呼ぶ）／"
        "その受注の商品のECCUBE在庫=10",
        "IT-A01-01-006専用。店頭受取分の商品IDを無視することの確認",
        "作り方は未確定（open_preconditions.tsv 参照）", "ケース専用"),
    row("S-A01-01-OUTBOUND-012", "商品・在庫", "在庫編集連携商品",
        "商品ID=SMA-A01-I01-012／店舗ID=1／在庫場所区分=スマレジ／ECCUBE在庫=10／スマレジ在庫=10",
        "IT-A01-01-012専用。在庫編集で10から7にする", MAKE, "ケース専用"),
    row("S-A01-01-OUTBOUND-013", "商品・在庫", "在庫一括編集連携商品",
        "商品ID=SMA-A01-I01-013／店舗ID=1／在庫場所区分=スマレジ／ECCUBE在庫=10／スマレジ在庫=10、"
        "商品ID=SMA-A01-I02-013／店舗ID=1／在庫場所区分=スマレジ／ECCUBE在庫=20／スマレジ在庫=20",
        "IT-A01-01-013専用。在庫一括編集で2商品を変更する", MAKE, "ケース専用"),
    row("S-A01-01-OUTBOUND-014", "商品・在庫", "連携対象外の在庫場所の商品",
        "商品ID=SMA-A01-E01／店舗ID=1／在庫場所区分=ECCUBE／ECCUBE在庫=10／スマレジ在庫=10",
        "IT-A01-01-014専用。在庫場所区分がスマレジでない在庫を変更する",
        MAKE.replace("在庫場所スマレジの在庫", "在庫場所ECCUBEの在庫"), "ケース専用"),
]
for n in ("015", "016"):
    SEEDS.append(row(f"S-A01-01-MOVE-{n}", "商品・在庫", f"移動入庫用商品({n})",
                     f"商品ID=SMA-A01-MIN-{n}／移動元=店舗ID 1・在庫場所ECCUBEの在庫=3／移動先=店舗ID 1・在庫場所スマレジの在庫=5／スマレジ在庫=5／在庫場所ECCUBEからスマレジへ3個の移動が登録済みで移動指示は未作成",
                     f"IT-A01-01-{n}専用。在庫場所ECCUBEからスマレジへ3個移動する", MAKE + "。移動は在庫移動・振替登録画面で登録し、移動指示にはしない", "ケース専用"))
for n in ("017", "018"):
    SEEDS.append(row(f"S-A01-01-MOVE-{n}", "商品・在庫", f"移動出庫用商品({n})",
                     f"商品ID=SMA-A01-MOUT-{n}／移動元=店舗ID 1・在庫場所スマレジの在庫=8／スマレジ在庫=8／移動先=店舗ID 1・在庫場所ECCUBEの在庫=0／在庫場所スマレジからECCUBEへ3個の移動が登録済みで移動指示は未作成",
                     f"IT-A01-01-{n}専用。在庫場所スマレジからECCUBEへ3個移動する", MAKE + "。移動は在庫移動・振替登録画面で登録し、移動指示にはしない", "ケース専用"))
SEEDS += [
    row("S-A01-01-PACK-019", "商品・在庫", "分割連携商品",
        "SMA-A01-SRC=10／SMA-A01-BAG=1／両商品とも店舗ID 1・在庫場所スマレジの在庫で、スマレジ試験環境の在庫も同数",
        "IT-A01-01-019専用。分割で出庫・入庫する", MAKE, "ケース専用"),
    row("S-A01-01-PACK-020", "商品・在庫", "結合連携商品",
        "SMA-A01-MSRC1=10／SMA-A01-MSRC2=10／SMA-A01-MBAG=1／3商品とも店舗ID 1・在庫場所スマレジの在庫で、スマレジ試験環境の在庫も同数",
        "IT-A01-01-020専用。結合で出庫・入庫する", MAKE, "ケース専用"),
    row("S-A01-01-COUNT-021", "商品・在庫", "棚卸し連携商品",
        "商品ID=SMA-A01-C01／店舗ID=1／ECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10／店舗ID 1の棚卸計画に本商品の明細があり、在庫は未反映",
        "IT-A01-01-021専用。棚卸結果の一括連携", MAKE + "。棚卸計画は管理画面の棚卸計画登録で店舗ID 1・在庫場所スマレジ・本商品を対象に作る", "ケース専用"),
    row("S-A01-01-CSV-FILES-022", "CSV・商品・在庫", "分割しない件数のCSV",
        "A01-stock-099.csv=在庫増減数+1の行99件（商品ID=SMA-A01-K099-01〜SMA-A01-K099-99）／各商品のECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10",
        "IT-A01-01-022専用。100件以下は分割しないことの確認", MAKE_CSV, "ケース専用"),
    row("S-A01-01-CSV-FILES-023", "CSV・商品・在庫", "分割する件数のCSV",
        "A01-stock-101.csv=在庫増減数+1の行101件（商品ID=SMA-A01-K101-001〜SMA-A01-K101-101）／各商品のECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10",
        "IT-A01-01-023専用。100件単位で分割することの確認", MAKE_CSV, "ケース専用"),
]
for n in ("024", "025", "029", "030"):
    SEEDS.append(row(f"S-A01-01-CB-SUCCESS-{n}", "CSV・商品・在庫", f"成功コールバック用データ({n})",
                     f"A01-callback-success-{n}.csv=SMA-A01-CBIN-{n}の在庫増減数+3、SMA-A01-CBOUT-{n}の在庫増減数-2（相対処理区分3）"
                     f"／両商品のECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10",
                     f"IT-A01-01-{n}専用。一括相対更新とコールバック", MAKE_CSV, "ケース専用"))
SEEDS.append(row("S-A01-01-BULK-RELATIVE-026", "CSV・商品・在庫", "相対値更新確認データ",
                 "A01-relative-minus.csv=SMA-A01-RELの在庫増減数-3／SMA-A01-RELのECCUBE在庫場所スマレジの在庫=20／スマレジ在庫=20",
                 "IT-A01-01-026専用。在庫総数でなく相対値で更新することの確認", MAKE_CSV, "ケース専用"))
for n in ("031", "032"):
    SEEDS.append(row(f"S-A01-01-CB-ERROR-{n}", "CSV・商品・在庫", f"エラーコールバック用データ({n})",
                     f"A01-callback-error-{n}.csv=SMA-A01-CBERR-{n}の在庫増減数+4／SMA-A01-CBERR-{n}のECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10",
                     f"IT-A01-01-{n}専用。エラー結果の受信（エラー結果は中継から送る）", MAKE_CSV, "ケース専用"))
SEEDS.append(row("S-A01-01-CB-CORRELATION-033", "CSV・商品・在庫", "コールバック対応付けデータ",
                 "A01-callback-A.csv=SMA-A01-CBAの在庫増減数+2、A01-callback-B.csv=SMA-A01-CBBの在庫増減数+5／"
                 "両商品のECCUBE在庫場所スマレジの在庫=10／スマレジ在庫=10",
                 "IT-A01-01-033専用。問い合わせIDで処理対象のCSVを特定することの確認", MAKE_CSV, "ケース専用"))

HOLD = "中継を保留モードにする（結果通知をECCUBEへ転送せずに止める）"
FWD = "中継を転送モードにする（結果通知をそのままECCUBEへ転送する）"
T1 = "類型承認T1（外部が発番する値は手順中で控えた値と照合する。2026-09-28 依頼者）"

# テストID末尾 → [使用シード, 事前準備の各項, 改名[(旧,新)], 新手順 or None, 手順変更理由]
CASES = {}
KIND = {}     # 手順変更の種別（README P8）
ORACLE = {}   # 期待結果の変更（README P7）: 末尾 → (新期待結果, 理由, 承認)
for n in ("001", "002", "003"):
    CASES[n] = [["S-A01-01-ENV", f"S-A01-01-SALE-{n}"],
                [ENV, sm(f"SMA-A01-001-{n}", 10, f"。店頭受取分ではない（S-A01-01-SALE-{n}）")],
                [("SMA-A01-001", f"SMA-A01-001-{n}")], None, ""]
CASES["001"][0].append("S-A01-01-RELAY"); CASES["001"][1].append(RELAY)
CASES["001"][3] = ("1. スマレジで商品ID SMA-A01-001-001を2個販売して取引を完了する／"
                   "2. 中継の記録で、/smaregi/stocksへ送信されたWebhookに対するECCUBEの応答を確認する")
CASES["001"][4] = "サーバー間のWebhook応答はブラウザで見えないため、観測先を中継の記録にした"
KIND["001"] = "中継置換"
CASES["003"][3] = ("1. スマレジで商品ID SMA-A01-001-003を2個販売して取引を完了する／"
                   "2. スマレジ試験環境の在庫変動履歴で、手順1の販売で発番された在庫変動履歴IDを控える／"
                   "3. DBで商品ID SMA-A01-001-003の在庫変動履歴を確認する")
CASES["003"][4] = "在庫変動履歴IDはスマレジが発番し事前に決められないため、発番値を手順中で控える"
KIND["003"] = "発番値控え"
ORACLE["003"] = ("スマレジ在庫変動履歴ID（手順2で控えた値）がECCUBE側の在庫変動履歴に紐づいて保存されること",
                 "基線の1001はスマレジが発番する値で、事前に決められない", T1)
CASES["004"] = [["S-A01-01-ENV", "S-A01-01-RETURN-004"],
                [ENV, sm("SMA-A01-002-004", 10, "（S-A01-01-RETURN-004）"),
                 "スマレジ試験環境のレジで店舗ID 1に対応する店舗を選び、商品ID SMA-A01-002-004を2個販売して取引を完了し、取引IDを控える。"
                 "ECCUBEの店舗ID 1・在庫場所スマレジの在庫とスマレジ試験環境の在庫がともに8になったことを確認する。"
                 "ならなければ本ケースは前提不成立として記録し、実施しない"],
                [("SMA-A01-002", "SMA-A01-002-004")],
                "1. スマレジで事前準備③で控えた取引（商品ID SMA-A01-002-004を2個販売した取引）を全キャンセルする／"
                "2. DBで店舗ID 1の商品ID SMA-A01-002-004のスマレジ在庫を確認する",
                "キャンセル対象を事前準備で作った取引に特定した"]
CASES["005"] = [["S-A01-01-ENV", "S-A01-01-OTHER-DIVISIONS-005"],
                [ENV, "商品ID SMA-A01-O01〜SMA-A01-O15の15商品が、それぞれECCUBEの店舗ID 1・在庫場所スマレジの在庫10、"
                      "スマレジ試験環境の在庫10で登録されている（S-A01-01-OTHER-DIVISIONS-005）"], [], None, ""]
CASES["006"] = [["S-A01-01-ENV", "S-A01-01-PICKUP-006"],
                [ENV, "店頭受取の受注が1件あり、その受注に対応する商品がスマレジ試験環境にあり（本ケースでは商品ID SMA-A01-PICKUPと呼ぶ）、"
                      "その受注の商品のECCUBE在庫が10である（S-A01-01-PICKUP-006）"], [], None, ""]
CASES["012"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-OUTBOUND-012"],
                [ENV, ADM, "在庫場所区分がスマレジの" + sm("SMA-A01-I01-012", 10, "（S-A01-01-OUTBOUND-012）")],
                [("SMA-A01-I01", "SMA-A01-I01-012")], None, ""]
CASES["013"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-OUTBOUND-013"],
                [ENV, ADM, "在庫場所区分がスマレジの商品ID SMA-A01-I01-013がECCUBEの店舗ID 1の在庫10・スマレジ試験環境の在庫10、"
                           "SMA-A01-I02-013がECCUBEの店舗ID 1の在庫20・スマレジ試験環境の在庫20で登録されている（S-A01-01-OUTBOUND-013）"],
                [("SMA-A01-I01", "SMA-A01-I01-013"), ("SMA-A01-I02", "SMA-A01-I02-013")], None, ""]
CASES["014"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-OUTBOUND-014"],
                [ENV, ADM, "在庫場所区分がスマレジではない（ECCUBEの）商品ID SMA-A01-E01が、ECCUBEの店舗ID 1の在庫10、"
                           "スマレジ試験環境の在庫10で登録されている（S-A01-01-OUTBOUND-014）"], [], None, ""]
for n in ("015", "016"):
    CASES[n] = [["S-A01-01-ENV", "S-A01-01-ADM", f"S-A01-01-MOVE-{n}"],
                [ENV, ADM, f"商品ID SMA-A01-MIN-{n}の在庫が、店舗ID 1の在庫場所ECCUBEに3、在庫場所スマレジに5、"
                           f"スマレジ試験環境に5ある。在庫移動・振替登録画面で在庫場所ECCUBEから在庫場所スマレジへ3個の移動を登録してあり、まだ移動指示にしていない（S-A01-01-MOVE-{n}）"],
                [("SMA-A01-MIN", f"SMA-A01-MIN-{n}")], None, ""]
for n in ("017", "018"):
    CASES[n] = [["S-A01-01-ENV", "S-A01-01-ADM", f"S-A01-01-MOVE-{n}"],
                [ENV, ADM, f"商品ID SMA-A01-MOUT-{n}の在庫が、店舗ID 1の在庫場所スマレジに8、スマレジ試験環境に8、在庫場所ECCUBEに0ある。"
                           f"在庫移動・振替登録画面で在庫場所スマレジから在庫場所ECCUBEへ3個の移動を登録してあり、まだ移動指示にしていない（S-A01-01-MOVE-{n}）"],
                [("SMA-A01-MOUT", f"SMA-A01-MOUT-{n}")], None, ""]
CASES["019"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-PACK-019"],
                [ENV, ADM, "店舗ID 1の在庫場所スマレジに商品ID SMA-A01-SRCが10、SMA-A01-BAGが1あり、"
                           "スマレジ試験環境の在庫も同じである（S-A01-01-PACK-019）"], [], None, ""]
CASES["020"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-PACK-020"],
                [ENV, ADM, "店舗ID 1の在庫場所スマレジに商品ID SMA-A01-MSRC1が10、SMA-A01-MSRC2が10、SMA-A01-MBAGが1あり、"
                           "スマレジ試験環境の在庫も同じである（S-A01-01-PACK-020）"], [], None, ""]
CASES["021"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-COUNT-021"],
                [ENV, ADM, sm("SMA-A01-C01", 10, "。店舗ID 1の棚卸計画に本商品の明細があり、在庫はまだ反映していない（S-A01-01-COUNT-021）")], [], None, ""]
for n, cnt, rng in (("022", 99, "SMA-A01-K099-01〜SMA-A01-K099-99"), ("023", 101, "SMA-A01-K101-001〜SMA-A01-K101-101")):
    CASES[n] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-CSVFORM", f"S-A01-01-CSV-FILES-{n}"],
                [ENV, ADM, CSVIN,
                 f"商品{cnt}件（{rng}）がECCUBEの店舗ID 1・在庫場所スマレジの在庫10、スマレジ試験環境の在庫10で登録され、"
                 f"その{cnt}件を在庫増減数+1で並べたA01-stock-{int(cnt):03d}.csvが手元にある（S-A01-01-CSV-FILES-{n}）"],
                [], None, ""]
CASES["026"] = [["S-A01-01-ENV", "S-A01-01-ADM", "S-A01-01-CSVFORM", "S-A01-01-BULK-RELATIVE-026"],
                [ENV, ADM, CSVIN, "商品ID SMA-A01-RELがECCUBEの店舗ID 1・在庫場所スマレジの在庫20、スマレジ試験環境の在庫20で登録され、"
                                  "在庫増減数を-3としたA01-relative-minus.csvが手元にある（S-A01-01-BULK-RELATIVE-026）"], [], None, ""]
for n in ("024", "025", "029", "030"):
    CASES[n] = [["S-A01-01-ENV", "S-A01-01-RELAY", "S-A01-01-ADM", "S-A01-01-CSVFORM", f"S-A01-01-CB-SUCCESS-{n}"],
                [ENV, RELAY, ADM, CSVIN,
                 f"商品ID SMA-A01-CBIN-{n}とSMA-A01-CBOUT-{n}がECCUBEの店舗ID 1・在庫場所スマレジの在庫10、スマレジ試験環境の在庫10で登録され、"
                 f"SMA-A01-CBIN-{n}を+3、SMA-A01-CBOUT-{n}を-2（相対処理区分3）とするA01-callback-success-{n}.csvが手元にある（S-A01-01-CB-SUCCESS-{n}）"],
                [("A01-callback-success.csv", f"A01-callback-success-{n}.csv"), ("SMA-A01-CBIN", f"SMA-A01-CBIN-{n}"),
                 ("SMA-A01-CBOUT", f"SMA-A01-CBOUT-{n}")], None, ""]
CASES["024"][1].append(HOLD)
CASES["024"][3] = ("1. 在庫変更CSV登録画面でA01-callback-success-024.csvを登録する／"
                   "2. 中継に結果通知が届き、保留されたことを確認する／"
                   "3. 結果通知を転送しないまま、DBで商品ID SMA-A01-CBIN-024およびSMA-A01-CBOUT-024のECCUBE在庫を確認する")
CASES["024"][4] = "「コールバックが返る前」を確実に作るため、結果通知を中継で止めてから確認する"
KIND["024"] = "中継置換"
CASES["025"][1].append(FWD)
for n, last in (("029", "4. DBで両商品のECCUBE在庫を確認する"), ("030", "4. 在庫変更CSV登録画面のCSV履歴を確認する")):
    CASES[n][1].append(HOLD)
    CASES[n][3] = (f"1. 在庫変更CSV登録画面でA01-callback-success-{n}.csvを登録する／"
                   "2. 中継に結果通知が届き、保留されたことを確認する。結果通知の問い合わせIDと成功結果を中継の記録で確認する／"
                   "3. 保留した結果通知を、登録時に指定したコールバックURLへ転送する／" + last)
    CASES[n][4] = "スマレジが返す結果通知は中継で止めてから転送する（試験者がスマレジAPIから送る手段は無い）"
    KIND[n] = "中継置換"
for n in ("031", "032"):
    CASES[n] = [["S-A01-01-ENV", "S-A01-01-RELAY", "S-A01-01-ADM", "S-A01-01-CSVFORM", f"S-A01-01-CB-ERROR-{n}"],
                [ENV, RELAY, ADM, CSVIN,
                 f"商品ID SMA-A01-CBERR-{n}がECCUBEの店舗ID 1・在庫場所スマレジの在庫10、スマレジ試験環境の在庫10で登録され、"
                 f"SMA-A01-CBERR-{n}を+4とするA01-callback-error-{n}.csvが手元にある（S-A01-01-CB-ERROR-{n}）", HOLD],
                [("A01-callback-error.csv", f"A01-callback-error-{n}.csv"), ("SMA-A01-CBERR", f"SMA-A01-CBERR-{n}")], None,
                "スマレジにエラーを起こす手段が無いため、保留したスマレジの結果通知は転送せず、同じ問い合わせIDのエラー結果を中継から送る"]
    KIND[n] = "中継置換,発番値控え"
CASES["031"][3] = ("1. 在庫変更CSV登録画面で商品ID SMA-A01-CBERR-031を+4としたA01-callback-error-031.csvを登録する／"
                   "2. 中継に結果通知が届き、保留されたことを確認し、その問い合わせIDを控える。保留した結果通知は転送しない／"
                   "3. 中継から、手順2で控えた問い合わせIDとエラーメッセージE-A01-001のエラー結果をコールバックURLへ送信する／"
                   "4. DBで商品ID SMA-A01-CBERR-031のECCUBE在庫を確認する")
CASES["032"][3] = ("1. 在庫変更CSV登録画面でA01-callback-error-032.csvを登録する／"
                   "2. 中継に結果通知が届き、保留されたことを確認し、その問い合わせIDを控える。保留した結果通知は転送しない／"
                   "3. 中継から、手順2で控えた問い合わせIDとエラーメッセージE-A01-001のエラー結果をコールバックURLへ送信する／"
                   "4. 在庫変更CSV登録画面のCSV履歴を確認する")
CASES["033"] = [["S-A01-01-ENV", "S-A01-01-RELAY", "S-A01-01-ADM", "S-A01-01-CSVFORM", "S-A01-01-CB-CORRELATION-033"],
                [ENV, RELAY, ADM, CSVIN,
                 "商品ID SMA-A01-CBAとSMA-A01-CBBがECCUBEの店舗ID 1・在庫場所スマレジの在庫10、スマレジ試験環境の在庫10で登録され、"
                 "SMA-A01-CBAを+2とするA01-callback-A.csvとSMA-A01-CBBを+5とするA01-callback-B.csvが手元にある（S-A01-01-CB-CORRELATION-033）", HOLD],
                [],
                "1. 在庫変更CSV登録画面でA01-callback-A.csvとA01-callback-B.csvを登録する／"
                "2. 中継の記録で、A01-callback-A.csvの登録に対してスマレジが返した問い合わせIDを控える。2件の結果通知が届き、保留されたことを確認する／"
                "3. 保留した結果通知のうち、手順2で控えた問い合わせIDのものだけをコールバックURLへ転送する／"
                "4. DBで商品ID SMA-A01-CBAおよびSMA-A01-CBBのECCUBE在庫を確認する",
                "問い合わせIDはスマレジが発番するため手順中で控える。結果通知は中継で止め、Aの分だけを転送する"]
KIND["033"] = "中継置換,発番値控え"
ORACLE["033"] = ("手順2で控えたA01-callback-A.csvの問い合わせIDに対応するSMA-A01-CBAだけが10から12に更新され、SMA-A01-CBBは10のままであること",
                 "基線のQ-A01-Aはスマレジが発番する値で、事前に決められない", T1)
KIND["004"] = "データ指示"

MARK = "①②③④⑤⑥⑦⑧"


def main():
    rows = list(csv.DictReader(open(PC / f"baseline/{FID}_test_cases.tsv", encoding="utf-8"), delimiter="\t"))
    hdr = list(rows[0].keys())
    ren, chg, orc = [], [], []
    for r in rows:
        if r["実行区分"] == "保留":
            continue
        n = r["テストID"][-3:]
        seeds, prep, pairs, steps, why = CASES[n]
        r["使用シード"] = ",".join(seeds)
        r["事前準備"] = "／".join(f"{MARK[i]} {p}" for i, p in enumerate(prep))
        r["手順"] = steps if steps else apply(r["手順"], pairs)
        r["期待結果"] = ORACLE[n][0] if n in ORACLE else apply(r["期待結果"], pairs)
        ren += [(r["テストID"], a, b) for a, b in pairs]
        if steps:
            chg.append((r["テストID"], KIND[n], steps, why))
        if n in ORACLE:
            orc.append((r["テストID"], *ORACLE[n]))
    _write(CG / f"cases/{FID}_test_cases.tsv", hdr, ([r[h] for h in hdr] for r in rows))
    _write(CG / f"cases/{FID}_seed_data.tsv", ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"], SEEDS)
    _write(PC / f"renames/{FID}.tsv", ["テストID", "旧", "新"], ren)
    _write(PC / f"step_changes/{FID}.tsv", ["テストID", "種別", "新手順", "理由"], chg)
    _write(PC / f"oracle_changes/{FID}.tsv", ["テストID", "新期待結果", "理由", "承認"], orc)


def _write(p, hdr, rows):
    p.parent.mkdir(exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="") as f:
        wr = csv.writer(f, delimiter="\t", lineterminator="\n")
        wr.writerow(hdr)
        wr.writerows(rows)


if __name__ == "__main__":
    main()
