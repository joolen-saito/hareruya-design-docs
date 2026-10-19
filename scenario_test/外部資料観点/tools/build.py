"""spec.py と抽出TSVから、観点の体系（シナリオテスト観点.md の第1部に取り込む断片）・根拠台帳・ラベル対応表を作る。
使い方: build.py <抽出TSVのディレクトリ> <出力ディレクトリ>
- refs が存在しない行・除外候補を指していたら止める。
- 出典欄は refs から機械的に作る（手書きしない）。
"""
import csv
import os
import re
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spec import GROUPS, LABEL_MAP, VIEWPOINTS  # noqa: E402

ext_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)

FILES = {
    "A": "A_youken.tsv", "B": "B_saikouchiku.tsv", "C": "C_koushinrai.tsv", "D": "D_kyokun.tsv",
    "E": "E_hikinou.tsv", "F": "F_jstqb_cf.tsv", "G": "G_security.tsv", "H": "H_law_a11y.tsv",
    "X": "X_images.tsv", "Z": "Z_author.tsv",
}

SOURCES = OrderedDict([
    ("S01", ("IPA「ユーザのための要件定義ガイド 第2版」(2019)", "https://www.ipa.go.jp/archive/publish/qv6pgp0000000wrt-att/000079352.pdf")),
    ("S02", ("IPA SEC「システム再構築を成功に導くユーザガイド 第2版」(2018)", "https://www.ipa.go.jp/files/000057294.pdf")),
    ("S03", ("IPA SEC「高信頼化ソフトウェアのための開発手法ガイドブック」Ver.1.0 (2010)", "https://www.ipa.go.jp/files/000004550.pdf")),
    ("S04", ("IPA「情報処理システム高信頼化教訓集（ITサービス編）」(2019)・同ダイジェスト・教訓リンク集の個別教訓", "https://www.ipa.go.jp/archive/digital/iot-en-ci/system/lesson.html")),
    ("S05", ("IPA「非機能要求グレード2018」（項目一覧・グレード表・樹系図・利用ガイド解説編）", "https://www.ipa.go.jp/archive/digital/iot-en-ci/jyouryuu/hikinou/ps6vr700000077he-att/000028843.zip")),
    ("S06", ("JSTQB「Foundation Level シラバス Version 2023V4.0.J02」", "https://jstqb.jp/dl/JSTQB-SyllabusFoundation_VersionV40.J02.pdf")),
    ("S07", ("IPA「共通フレーム2013」第3部「共通フレームとガイダンス」抜粋", "https://www.ipa.go.jp/publish/qv6pgp000000107j-att/000062659.pdf")),
    ("S08", ("IPA・経済産業省「ECサイト構築・運用セキュリティガイドライン」(2023年3月)", "https://www.ipa.go.jp/security/guide/vuln/ps6vr7000000acvt-att/000109337.pdf")),
    ("S09", ("IPA「安全なウェブサイトの作り方 改訂第7版」(2021年3月)", "https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000017316.pdf")),
    ("S10", ("クレジット取引セキュリティ対策協議会「クレジットカード・セキュリティガイドライン 6.1版」(2026年3月)", "https://www.j-credit.or.jp/security/pdf/Creditcardsecurityguidelines_6.1_published.pdf")),
    ("S11", ("消費者庁「通信販売の申込み段階における表示についてのガイドライン」（令和6年11月19日の通達改正で掲載の別添9）", "https://www.caa.go.jp/policies/policy/consumer_transaction/specified_commercial_transactions/assets/consumer_transaction_cms101_2401119_03.pdf")),
    ("S12", ("デジタル庁「ウェブアクセシビリティ導入ガイドブック」(2025年10月16日版)", "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/08ed88e1-d622-43cb-900b-84957ab87826/bf5f4482/20251016_introduction_to_web_accessibility.pdf")),
    ("P01", ("プロジェクト内資料「システムテストの目的とテストケースの完了基準」", "scenario_test/システムテストの目的と完了基準.md")),
])

KYOKUN_FILE = re.compile(r"^[GT]\d+\.txt$")


def source_of(fname):
    if fname in ("youken.txt",):
        return "S01", ""
    if fname in ("saikouchiku.txt", "saikouchiku_images.txt"):
        return "S02", ""
    if fname in ("koushinrai.txt", "koushinrai_images.txt"):
        return "S03", ""
    if KYOKUN_FILE.match(fname):
        return "S04", fname[:-4]  # 教訓ID
    if fname == "kyokun_main.txt":
        return "S04", "本編"
    if fname == "kyokun_digest.txt":
        return "S04", "ダイジェスト"
    if fname.startswith("hikinou_"):
        sub = {"hikinou_items.txt": "項目一覧", "hikinou_grade.txt": "グレード表",
               "hikinou_guide.txt": "解説編", "hikinou_tree.txt": "樹系図"}[fname]
        return "S05", sub
    if fname == "jstqb.txt":
        return "S06", ""
    if fname in ("cf_part3.txt", "cf_guide.txt"):
        return "S07", ""
    if fname == "ec.txt":
        return "S08", ""
    if fname == "websecurity.txt":
        return "S09", ""
    if fname == "credit.txt":
        return "S10", ""
    if fname == "caa.txt":
        return "S11", ""
    if fname == "a11y.txt":
        return "S12", ""
    if fname == "mokuteki_kanryo.txt":
        return "P01", ""
    raise SystemExit(f"出典不明のファイル: {fname}")


rows = {}
for k, f in FILES.items():
    with open(os.path.join(ext_dir, f), encoding="utf-8") as fh:
        data = list(csv.reader(fh, delimiter="\t", quoting=csv.QUOTE_NONE))[1:]
    for i, r in enumerate(data, start=1):
        rows[f"{k}{i}"] = r

errors = []
evidence = []
cites = {}
for vp in VIEWPOINTS:
    refs = vp["refs"].split()
    if not refs:
        errors.append(f"{vp['id']}: refs が空")
    per_src = OrderedDict()
    for ref in refs:
        r = rows.get(ref)
        if r is None:
            errors.append(f"{vp['id']}: {ref} が存在しない")
            continue
        if r[0] != "候補":
            errors.append(f"{vp['id']}: {ref} は除外候補")
        fname, page, loc = r[4].strip(), r[5].strip(), r[6].strip()
        sid, sub = source_of(fname)
        label = f"{sub} p{page}" if sub else f"p{page}"
        if sid == "P01":
            label = f"「{loc}」"  # プロジェクト内資料はページでなく節で示す
        if fname.endswith("_images.txt"):
            label += "（図表）"
        per_src.setdefault(sid, [])
        if label not in per_src[sid]:
            per_src[sid].append(label)
        evidence.append([vp["id"], ref, sid, sub, fname, page, loc, r[3]])
    cites[vp["id"]] = "; ".join(f"{s} {', '.join(v)}" for s, v in per_src.items())

ids = [v["id"] for v in VIEWPOINTS]
if len(ids) != len(set(ids)):
    errors.append("観点IDが重複している")
gids = {g[0] for g in GROUPS}
for v in VIEWPOINTS:
    if v["id"][:5] not in gids:
        errors.append(f"{v['id']}: 所属グループが無い")

vp_by_id = {v["id"]: v for v in VIEWPOINTS}
labels = [m[0] for m in LABEL_MAP]
if len(labels) != len(set(labels)):
    errors.append("LABEL_MAP のラベルが重複している")
for label, primary, related, _ in LABEL_MAP:
    for x in [primary] + [r for r in related.split(",") if r]:
        if x not in vp_by_id:
            errors.append(f"LABEL_MAP {label}: {x} が観点に無い")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)

with open(os.path.join(out_dir, "evidence.tsv"), "w", encoding="utf-8") as f:
    f.write("観点ID\t参照\t出典ID\t資料内の区分\t抽出テキスト\tPDFページ\t資料内の位置\t原文抜粋\n")
    for e in evidence:
        f.write("\t".join(x.replace("\t", " ") for x in e) + "\n")

# 目視確認用: 観点ごとに参照行の観点名を並べる（--refcheck を付けたときだけ出す）
if "--refcheck" in sys.argv:
    with open(os.path.join(out_dir, "_refcheck.txt"), "w", encoding="utf-8") as f:
        for vp in VIEWPOINTS:
            f.write(f"## {vp['id']} {vp['name']}\n")
            for ref in vp["refs"].split():
                f.write(f"  {ref}: {rows[ref][1]} | {rows[ref][3][:90]}\n")

# 作成済みテスト項目のラベルと観点の対応表（audit_scenario_delivery.py が読む）
group_name = {g[0]: g[1] for g in GROUPS}
with open(os.path.join(out_dir, "label_map.tsv"), "w", encoding="utf-8") as f:
    f.write("テスト観点\t対応する観点\t観点名\t分類\t分類名\t関連する観点\t付与規則の要約\n")
    for label, primary, related, rule in LABEL_MAP:
        g = primary[:5]
        f.write(f"{label}\t{primary}\t{vp_by_id[primary]['name']}\t{g}\t{group_name[g]}\t{related}\t{rule}\n")

# Markdown 本体の観点一覧部分
parts = []
for gid, gname, gdesc in GROUPS:
    parts.append(f"#### {gid} {gname}\n\n{gdesc}\n")
    parts.append("| ID | 観点 | 確認すること | 出典 | EC での確認例（著者例示） |")
    parts.append("| --- | --- | --- | --- | --- |")
    for vp in VIEWPOINTS:
        if vp["id"].startswith(gid + "-"):
            parts.append(f"| {vp['id']} | {vp['name']} | {vp['check']} | {cites[vp['id']]} | {vp['ec']} |")
    parts.append("")
body = "\n".join(parts)

src_lines = ["| ID | 資料 | 入手先 |", "| --- | --- | --- |"]
for sid, (title, url) in SOURCES.items():
    src_lines.append(f"| {sid} | {title} | {url} |")
sources_md = "\n".join(src_lines)

group_lines = ["| 分類 | 名前 | 観点の数 |", "| --- | --- | --- |"]
for gid, gname, _ in GROUPS:
    n = sum(1 for v in VIEWPOINTS if v["id"].startswith(gid + "-"))
    group_lines.append(f"| {gid} | {gname} | {n} |")
groups_md = "\n".join(group_lines)

tmpl_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fragment_template.md")
tmpl = open(tmpl_path, encoding="utf-8").read()


def read_opt(name, default):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), name)
    return open(p, encoding="utf-8").read().strip() if os.path.exists(p) else default


md = (tmpl.replace("{{STATUS}}", read_opt("status.md", "> 状態: 著者による初版。レビュー前。"))
          .replace("{{REVIEW}}", read_opt("review.md", "（未実施）"))
          .replace("{{GROUPS}}", groups_md)
          .replace("{{VIEWPOINTS}}", body)
          .replace("{{SOURCES}}", sources_md)
          .replace("{{N_VIEWPOINTS}}", str(len(VIEWPOINTS)))
          .replace("{{N_GROUPS}}", str(len(GROUPS)))
          .replace("{{N_EVIDENCE}}", str(len(evidence))))
with open(os.path.join(out_dir, "観点体系.md"), "w", encoding="utf-8") as f:
    f.write(md)
print(f"観点 {len(VIEWPOINTS)} / 分類 {len(GROUPS)} / 根拠 {len(evidence)} 行")
