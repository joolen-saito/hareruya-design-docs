/**
 * M07-01 買取検索一覧 — 戻しリストCSV・PDF の並び順（065・101〜112）。正本: cases/M07-01_test_cases.tsv
 *
 * 前提（事前準備②）の本店の高額商品閾値・色順マスタ・略称タグ TAG-C/TAG-A は共有の設定。シード S-M07-01-RETURN-CONFIG が、
 * いまの値が前提と違うときだけ書き換え、ケースの終わりに基盤が画面で元の値へ戻して確かめる（seeds/m07-01-e.ts。夜に1本だけで流す回で流す）。
 * 実在庫の商品（カード・略称タグ・商品）・会員・注文者名は実行の印つきで作る。ケースの「注文者名」「商品名」も同じ印つきの値として読む。
 * 管理画面の操作は試験管理者 m0701_admin（事前準備①）。
 * 戻しリストCSVは画面に出ないので、ダウンロードした中身を同じブラウザの別のタブに表として出して、手順5の画面に残す（アプリの画面ではない）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CSVを読む, 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0701ListPage } from "../../pages/admin/m07_01_list";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠の列 } from "../../lib/evidence_other";
import { M0701_ADMIN } from "../../seeds/m07-01";
import { 注文者名 } from "../../seeds/m07-01-b";
import { 品065, 商品名065, 控え065, 棚065, 組の商品名, 順の品, 並びの前提 } from "../../seeds/m07-01-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 始める(page: Page): Promise<M0701ListPage> {
  await loginAdmin(page, M0701_ADMIN);
  return new M0701ListPage(page);
}

type 出力 = "戻しリストCSV" | "戻しリストPDF";
type 読んだもの = { 商品名: string[]; CSVの枠: boolean };

const 正規 = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * 行の商品名の並びを確かめる。戻しリストCSVは、ダウンロードしたCSVを画面の枠に出してあるので、その枠の商品名の列で確かめる（赤枠がCSVの値に付く）。戻しリストPDFは読んだ行で確かめる。
 * 名前を与えると、その名前の行だけを取り出した並びで確かめる
 */
async function 商品名の並びを確かめる(page: Page, r: 読んだもの, 説明: string, 期待: string[], 取り出す?: string[]): Promise<void> {
  if (r.CSVの枠) {
    const 列 = CSVの枠の列(page, 0, "商品名");
    await expect.soft(取り出す ? 列.filter({ hasText: new RegExp(`^(${取り出す.map(正規).join("|")})$`) }) : 列, 説明).toHaveText(期待);
  } else {
    expect.soft(取り出す ? r.商品名.filter((x) => 取り出す.includes(x)) : r.商品名, 説明).toEqual(期待);
  }
}

/** 手順1〜5（一覧を開く → 注文者名で検索 → 買取にチェック → ダウンロード▼の出力 → 中身を読む）。読んだ行の商品名を返す */
async function 出力して読む(ctx: CaseCtx, 番号のラベル: string, 姓の正本: string, 項目: 出力): Promise<読んだもの> {
  const { page, notes, step } = ctx;
  const l = await 始める(page);
  const 番号 = notes.get(番号のラベル);
  let file: Awaited<ReturnType<M0701ListPage["ダウンロードを押す"]>>["file"] = null;
  let popup: Page | null = null;
  const r: 読んだもの = { 商品名: [], CSVの枠: 項目 === "戻しリストCSV" };
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.注文者名を入れる(注文者名(姓の正本));
    await l.検索する();
    await expect(l.行の(番号), `検索結果に買取番号${番号のラベル}の行が表示される`).toBeVisible({ timeout: 30_000 });
  });
  await step(3, async () => { await l.対象にする(番号); });
  await step(4, async () => {
    const d = await l.ダウンロードを押す(項目);
    file = d.file;
    popup = d.popup;
    const 出た = 項目 === "戻しリストCSV" ? d.file !== null : d.popup !== null;
    expect(出た, `「${項目}」を押して${項目 === "戻しリストCSV" ? "CSVがダウンロードされる" : "戻しリストが別のウィンドウに表示される"}（応答 ${d.応答 ?? "なし"}・警告 ${d.ダイアログ.join(" / ") || "なし"}）`).toBe(true);
  });
  await step(5, async () => {
    if (項目 === "戻しリストCSV") {
      const csv = await CSVを読む(file!);
      r.商品名 = csv.行.map((x) => x["商品名"] ?? "");
      await l.ダウンロードの選択肢を閉じる();
      await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${file!.suggestedFilename()}（買取番号 ${番号}）`, 行: CSVの全行(csv) }]);
    } else {
      const pdf = await 戻しリストを読む(popup!);
      r.商品名 = pdf.行.map((x) => x.商品名);
      await popup!.bringToFront();
    }
  });
  return r;
}

// ---------------------------------------------------------------------------
// 101〜112: 2品の組合せ
// ---------------------------------------------------------------------------

/** 2品（X・Y）の並び。CSV・PDF の行の商品名が X → Y の順で、ほかの行が無いこと */
function 二品の順(n: string, 姓の正本: string, 項目: 出力, 決める段: string): CaseBody {
  return async (ctx) => {
    const X = rc(組の商品名(n, "X")), Y = rc(組の商品名(n, "Y"));
    const r = await 出力して読む(ctx, `〔買取番号-M0701-${n}〕`, 姓の正本, 項目);
    await ctx.expected(async () => {
      note(`商品名は正本の値に実行の印を付けた値（X=${X}、Y=${Y}）。並びを決める段は${決める段}（シード表の値。前の段は2品で同じ、後ろの段は逆にしてある）`);
      const 媒体 = 項目 === "戻しリストCSV" ? "ダウンロードしたCSV" : "表示された戻しリスト";
      expect.soft(r.商品名.length, `${媒体}の行の数（買取の実在庫2件）`).toBe(2);
      await 商品名の並びを確かめる(ctx.page, r, `${媒体}の行の商品名の並び（「${組の商品名(n, "X")}」の行 → 「${組の商品名(n, "Y")}」の行）`, [X, Y]);
    });
  };
}

caseTest("IT-M07-01-101", 二品の順("101", "戻組合せ甲", "戻しリストCSV", "金額閾値（X 500円＝1000円未満、Y 3000円＝1000円以上5000円未満）"));
caseTest("IT-M07-01-102", 二品の順("102", "戻組合せ乙", "戻しリストCSV", "棚番（X V-102 並び順1、Y W-102 並び順2）"));
caseTest("IT-M07-01-103", 二品の順("103", "戻組合せ丙", "戻しリストCSV", "状態（X ニアミント、Y ヘビープレイド）"));
caseTest("IT-M07-01-104", 二品の順("104", "戻組合せ丁", "戻しリストCSV", "Foil（X 非Foil、Y Foil）"));
caseTest("IT-M07-01-105", 二品の順("105", "戻組合せ戊", "戻しリストCSV", "略称タグ（X 並び順1、Y 並び順2）"));
caseTest("IT-M07-01-106", 二品の順("106", "戻組合せ己", "戻しリストCSV", "レアリティ（X 神話レア、Y コモン）"));
caseTest("IT-M07-01-107", 二品の順("107", "戻組合せ庚", "戻しリストCSV", "色（X 赤、Y 青。色順マスタは赤が青より前）"));
caseTest("IT-M07-01-108", 二品の順("108", "戻組合せ辛", "戻しリストCSV", "コレクター番号（略称タグはコレクター番号順。X 1、Y 2。英語名は X Beta・Y Alpha）"));
caseTest("IT-M07-01-109", 二品の順("109", "戻組合せ壬", "戻しリストCSV", "英語のカード名（略称タグはアルファベット順。X Alpha、Y Beta。番号は X 2・Y 1）"));
caseTest("IT-M07-01-110", 二品の順("110", "戻組合せ癸", "戻しリストPDF", "棚番（X V-110 並び順1、Y W-110 並び順2）"));
caseTest("IT-M07-01-111", 二品の順("111", "戻組合せ子", "戻しリストPDF", "言語（X 日本語、Y 英語）"));

caseTest("IT-M07-01-112", async (ctx) => {
  const X = rc(組の商品名("112", "X")), Y = rc(組の商品名("112", "Y"));
  const r = await 出力して読む(ctx, "〔買取番号-M0701-112〕", "戻組合せ寅", "戻しリストCSV");
  await ctx.expected(async () => {
    note(`商品名は正本の値に実行の印を付けた値（X=${X}、Y=${Y}）。2品は並び順を決める段（金額閾値・棚番号・言語・状態・Foil・略称タグ・レアリティ・色・カード番号・英語名）がすべて同じ`);
    const 列 = CSVの枠の列(ctx.page, 0, "商品名");
    await expect.soft(列.filter({ hasText: new RegExp(`^${正規(X)}$`) }), `CSVの商品名「${組の商品名("112", "X")}」の行の数`).toHaveCount(1);
    await expect.soft(列.filter({ hasText: new RegExp(`^${正規(Y)}$`) }), `CSVの商品名「${組の商品名("112", "Y")}」の行の数`).toHaveCount(1);
    await expect.soft(列, "CSVの行の数（買取の実在庫2件だけ）").toHaveCount(2);
  });
});

// ---------------------------------------------------------------------------
// 065: 14件の全並び順キー
// ---------------------------------------------------------------------------

/**
 * 設計書（0206 戻しリスト 並び順）の規則で、2品の前後を決める。
 * 金額閾値の昇順（本店の閾値 1000/5000/未設定。サプライは最後）→ 棚番（棚番号の並び順の昇順）→ 言語（日→英→他言語）→ 状態（NM→HP）→
 * Foil（非Foil→Foil）→ 略称タグ（略称タグの並び順の昇順）→ レアリティ（M→C）→ 色（色順マスタの並び順）→
 * 略称タグがコレクター番号順ならカード番号の昇順、アルファベット順なら英語のカード名の昇順。
 */
function 規則で比べる(前: 並びの前提, a: 順の品, b: 順の品): number {
  const 区分 = (p: 順の品) => (p.札 === null ? 9 : Number(p.基準価格) < 1000 ? 1 : Number(p.基準価格) < 5000 ? 2 : 3);
  const 言語 = (p: 順の品) => ({ JP: 0, EN: 1 } as Record<string, number>)[p.言語] ?? 2;
  const 段 = (p: 順の品): (number | string)[] => {
    if (p.札 === null || p.タグ === null) return [区分(p)];
    const t = 前.タグ[p.タグ];
    return [区分(p), 前.棚[p.棚], 言語(p), p.状態 === "NM" ? 0 : 1, p.札.Foil ? 1 : 0, t.並び順, p.札.レア === "M" ? 0 : 1, 前.色[p.札.色], t.アルファベット順 ? rc(p.札.英名) : p.札.番号];
  };
  const x = 段(a), y = 段(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined || y[i] === undefined) return x.length - y.length;
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
}

caseTest("IT-M07-01-065", async (ctx) => {
  const r = await 出力して読む(ctx, "〔買取番号-M0701-065〕", "戻し順序試験", "戻しリストCSV");
  await ctx.expected(async () => {
    const 前 = 控え065.前提;
    if (!前) throw new Error("シード S-M07-01-RETURN-SORT-065 が、並びを決めるマスタの値を控えていない");
    const 並べた = [...品065].sort((a, b) => 規則で比べる(前, a, b));
    for (let i = 1; i < 並べた.length; i++) {
      if (規則で比べる(前, 並べた[i - 1], 並べた[i]) === 0) throw new Error(`期待の並びが決まらない（${並べた[i - 1].枝} と ${並べた[i].枝} の段がすべて同じ）`);
    }
    const 名 = (枝: string) => rc(商品名065(枝));
    const 説明 = (p: 順の品) => (p.札 === null
      ? `${商品名065(p.枝)}（サプライ・基準価格${p.基準価格}）`
      : `${商品名065(p.枝)}（基準価格${p.基準価格}・棚${棚065[p.棚].名称}・${p.言語}・${p.状態}・${p.札.Foil ? "Foil" : "非Foil"}・${p.タグ}・${p.札.レア}・${p.札.色}・番号${p.札.番号}・英語名${p.札.英名}）`);
    note(`期待の並び（設計書の規則で組み立てた。商品名は実行の印つき）: ${並べた.map((p, i) => `${i + 1}. ${説明(p)}`).join(" ／ ")}`);
    note(`並びに使ったマスタの値（シードが画面で読んだもの）: 棚 ${棚065.A1.名称}=${前.棚.A1}・${棚065.A2.名称}=${前.棚.A2}／略称タグの並び順 TAG-A=${前.タグ["TAG-A"].並び順}（アルファベット順）・TAG-C=${前.タグ["TAG-C"].並び順}（コレクター番号順）・TAG-Z（${前.タグ["TAG-Z"].名称}）=${前.タグ["TAG-Z"].並び順}／色順 赤=${前.色.赤}・青=${前.色.青}。「略称タグ（昇順）」は略称タグの並び順の昇順と読んだ`);
    await expect.soft(CSVの枠の列(ctx.page, 0, "商品名"), "CSVの行の数（実在庫14件）").toHaveCount(14);
    await 商品名の並びを確かめる(ctx.page, r, "CSVの行の商品名の並び（金額閾値の昇順・サプライ最後、閾値の中は棚番・言語・状態・Foil・略称タグ・レアリティ・色・タグ設定に応じた番号または英語名の順）", 並べた.map((p) => 名(p.枝)));
    // 観点ごとの前後（2行だけを取り出した並び）
    const 二行 = async (a: string, b: string, 観点: string) => {
      await 商品名の並びを確かめる(ctx.page, r, `${観点}: 「${商品名065(a)}」の行が「${商品名065(b)}」の行より前`, [名(a), 名(b)], [名(a), 名(b)]);
    };
    await 二行("S2", "MID", "金額閾値（1000円未満の棚A2 → 1000円以上5000円未満の棚A1）");
    await 二行("MID", "HIGH", "金額閾値（1000円以上5000円未満 → 5000円以上）");
    await 二行("HIGH", "SUP", "サプライは最後（5000円以上のカード → 基準価格500円のサプライ）");
    await 二行("R", "S2", "棚番（棚A1・仏 → 棚A2・日）");
    await 二行("H", "E", "言語（日・HP → 英・NM）");
    await 二行("E", "R", "言語（英 → 仏）");
    await 二行("F", "H", "状態（NM・Foil → HP・非Foil）");
    await 二行("CR", "F", "Foil（非Foil・TAG-C・C → Foil・TAG-Z・M）");
    if (前.タグ["TAG-A"].並び順 < 前.タグ["TAG-C"].並び順) 二行("A2", "C1", "略称タグ（TAG-A → TAG-C。並び順の昇順）");
    else await 二行("CR", "A1", "略称タグ（TAG-C・C → TAG-A・M。並び順の昇順）");
    await 二行("CB", "CR", "レアリティ（M・青 → C・赤）");
    await 二行("C2", "CB", "色（赤・番号2 → 青・番号1）");
    await 二行("C1", "C2", "コレクター番号（TAG-C はコレクター番号順。番号1・英語名Beta → 番号2・英語名Alpha）");
    await 二行("A1", "A2", "英語のカード名（TAG-A はアルファベット順。英語名Alpha・番号2 → 英語名Beta・番号1）");
  });
});
