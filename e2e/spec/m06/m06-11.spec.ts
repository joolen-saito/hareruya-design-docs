/**
 * M06-11 戻しリストPDF出力（店頭買取）。正本: cases/M06-11_test_cases.tsv
 *
 * シードは seeds/m06-11.ts。依頼者の決定（2026-11-10「印つきデータは何でも」）に従い、店舗・商品・カード・略称タグ・色順は印つきで画面から作る。
 * 読み替え（各シードの報告にも出る）:
 * - 「本店の高額商品閾値 1000/5000/10000」は、共有の設定を書き換えず、同じ閾値の試験用の店舗（本店相当）で確かめる。
 *   「支店A」の閾値 2000/7000/12000 は、同じ閾値の試験用の支店Aで確かめる。商品仕訳の見出し・順は同じ文で確かめる。
 * - 買取番号は買取一覧の「査定ID」の欄の値（控えた番号）。商品名・略称タグ・色順の名称は実行の印つき。
 * 実装していないケース（理由は報告）:
 * - 002・003・015・023: サプライ品を使う。サプライ品の作成はグッズ商品CSV登録しか無く、カテゴリIDの不具合（ECCUBE_HARERUYA-3966）に当たる。
 * - 004・029: 棚番号の並びは本店（店舗ID 1）限定で、試験用の店舗では確かめられない。029は本店の共有の閾値にも依る。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 査定申込日時を入れる } from "../../pages/admin/m06_11_setup";
import { PDFの行, 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0611_ADMIN, 品名, 閾値の } from "../../seeds/m06-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type PDF = { popup: Page | null; 行: PDFの行[]; 作成日時: string };
type 店 = "main" | "branch";

const f = (n: number) => n.toLocaleString("en-US");
/** 店の閾値と基準価格から、商品仕訳の見出しの部分（戻しリストの「（商品単位_…円未満）」） */
function 見出し(k: 店, 価格: number): string {
  const t = 閾値の(k);
  const i = t.filter((x) => 価格 >= x).length;
  if (i === 0) return `（商品単位_${f(t[0])}円未満）`;
  if (i === t.length) return `（商品単位_${f(t[t.length - 1])}円以上）`;
  return `（商品単位_${f(t[i - 1])}円以上_${f(t[i])}円未満）`;
}
const 店の名 = (k: 店) => (k === "main" ? "本店" : "支店A");
const 閾値の文 = (k: 店) => `「${店の名(k)}」は、同じ閾値の試験用の店舗（${閾値の(k).map(f).join("円・")}円）で確かめた`;

type 開始 = { 日時を空にする?: boolean; 範囲?: [string, string]; 対象: string[] };

/** 手順1〜5。PDF の行を返す */
async function 手順1から5(ctx: CaseCtx, o: 開始, 検索: "買取番号" | "申込日時", 押す前?: () => void): Promise<PDF> {
  const { page, step } = ctx;
  await loginAdmin(page, M0611_ADMIN);
  const list = new OtcListPage(page);
  let pdf: PDF = { popup: null, 行: [], 作成日時: "" };
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    if (検索 === "申込日時") {
      await 査定申込日時を入れる(page, o.範囲![0], o.範囲![1]);
      note("査定申込日時の欄は日時の入力欄のため、開始・終了とも正本の日時（秒まで）をそのまま入れた。チェックは査定IDで探して付ける");
    } else {
      if (o.日時を空にする) {
        await list.日時を空にする();
        note("買取の査定申込日時（2026-09-30 09:31）が検索欄の初期の期間（先月1日から）より前のため、査定申込日時の欄を空にして検索した");
      }
      await list.査定IDを入れる(o.対象[0]);
      note("手順2の「買取番号」は、買取一覧の検索欄の「査定ID」の欄に入れた（一覧の査定IDの欄が買取番号）");
    }
    await list.検索する();
  });
  await step(3, async () => { for (const id of o.対象) await list.対象にする(id); });
  await step(4, async () => {
    押す前?.();
    const r = await list.ダウンロードを押す("戻しリストPDF");
    if (r.ダイアログ.length) note(`戻しリストPDFを押すと警告が出た: ${r.ダイアログ.join(" / ")}`);
    pdf = { popup: r.popup, 行: [], 作成日時: "" };
  });
  await step(5, async () => {
    expect(pdf.popup, "戻しリストPDFのページ（別ウィンドウ）が開いた").not.toBeNull();
    const r = await 戻しリストを読む(pdf.popup!);
    pdf = { popup: pdf.popup, 行: r.行, 作成日時: r.作成日時 };
  });
  return pdf;
}

const 位置 = (p: PDF, 名: string): number => p.行.findIndex((r) => r.商品名.trim() === 品名(名));
const 行 = (p: PDF, 名: string): PDFの行 | undefined => p.行[位置(p, 名)];
const q = (名: string) => `「${名}」`;

/** 名の順に上から出ているか */
function 順(p: PDF, 名: string[]): { ok: boolean; 項目: string } {
  const idx = 名.map((n) => 位置(p, n));
  const 実際 = 名.map((n, i) => `${n}=${idx[i] < 0 ? "無し" : `${idx[i] + 1}行目`}`).join("、");
  return { ok: idx.every((x) => x >= 0) && idx.every((x, i) => i === 0 || x > idx[i - 1]), 項目: `${名.map(q).join("")}の順に上から表示される（表示された位置: ${実際}）` };
}

const L = (n: string) => `〔買取番号-M0611-${n}〕`;

/** 同じ金額閾値内の順だけを見るケース */
function 順のケース(n: string, 名: string[]) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, { 対象: [ctx.notes.get(L(n))] }, "買取番号");
    await ctx.expected(async () => {
      const o = 順(p, 名);
      expect.soft(o.ok, o.項目).toBe(true);
    });
  };
}

/** シングルカード: 商品仕訳の見出しに A・B があり、A が B より上 */
function CB型(n: string, k: 店, 価格: number, 説明: string) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, { 対象: [ctx.notes.get(L(n))] }, "買取番号");
    await ctx.expected(async () => {
      note(`${閾値の文(k)}。基準価格${f(価格)}円の見出しは「${見出し(k, 価格)}」。${説明}`);
      for (const b of ["A", "B"]) {
        const r = 行(p, `M0611-${n}-${b}`);
        expect.soft(r?.仕訳 ?? "（行が無い）", `「M0611-${n}-${b}」の行の商品仕訳（見出し「${見出し(k, 価格)}」）`).toContain(見出し(k, 価格));
      }
      const o = 順(p, [`M0611-${n}-A`, `M0611-${n}-B`]);
      expect.soft(o.ok, o.項目).toBe(true);
    });
  };
}

// ---- 選択した買取の実在庫だけ ----
caseTest("IT-M06-11-001", async (ctx) => {
  const p = await 手順1から5(ctx, { 対象: [ctx.notes.get(L("001A"))] }, "買取番号");
  await ctx.expected(async () => {
    expect.soft(位置(p, "選択対象A") >= 0, "「選択対象A」が表示される").toBe(true);
    expect.soft(位置(p, "選択対象B") >= 0, "「選択対象B」が表示される").toBe(true);
    expect.soft(位置(p, "非対象C") >= 0, "「非対象C」は表示されない").toBe(false);
    expect.soft(p.行.length, "表示された商品の行数（選択した買取の実在庫の2件だけ）").toBe(2);
  });
});

// ---- 005: 支店Aは棚番号ではなく言語 ----
caseTest("IT-M06-11-005", async (ctx) => {
  const p = await 手順1から5(ctx, { 対象: [ctx.notes.get(L("005"))] }, "買取番号");
  await ctx.expected(async () => {
    note("棚番号Z99・A01は、登録せず既存の棚番号から並び順の違う2つを使った（日本語商品=並び順の大きい棚、英語商品=並び順の小さい棚）");
    const o = 順(p, ["BRANCH-JP", "BRANCH-EN"]);
    expect.soft(o.ok, `${o.項目}。棚番号の順ではなく言語の日→英の順になる`).toBe(true);
  });
});

// ---- 並び順 ----
caseTest("IT-M06-11-006", 順のケース("006", ["COND-NM", "COND-HP"]));
caseTest("IT-M06-11-007", 順のケース("007", ["NON-FOIL", "FOIL"]));
caseTest("IT-M06-11-008", 順のケース("008", ["ABBR-A", "ABBR-B"]));
caseTest("IT-M06-11-009", 順のケース("009", ["RARITY-M", "RARITY-C"]));
caseTest("IT-M06-11-010", 順のケース("010", ["COLOR-WHITE", "COLOR-BLUE"]));
caseTest("IT-M06-11-011", 順のケース("011", ["COL-002", "COL-010"]));
caseTest("IT-M06-11-012", 順のケース("012", ["ALPHA", "ZEBRA"]));
caseTest("IT-M06-11-021", 順のケース("021", ["M0611-021-JP", "M0611-021-EN", "M0611-021-KO"]));

// ---- 022: 作成日時 ----
const jst = (d: Date): string => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
caseTest("IT-M06-11-022", async (ctx) => {
  let t = new Date();
  const p = await 手順1から5(ctx, { 日時を空にする: true, 対象: [ctx.notes.get(L("022"))] }, "買取番号", () => { t = new Date(); });
  const t2 = new Date();
  await ctx.expected(async () => {
    const m = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/.exec(p.作成日時);
    expect.soft(m !== null, `作成日時欄の表示（${p.作成日時 || "なし"}）が年月日時分として読める`).toBe(true);
    if (m) {
      const shown = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")} ${m[4].padStart(2, "0")}:${m[5]}`;
      expect.soft([jst(t), jst(t2)], `作成日時欄の年月日時分（${shown}）が、手順4で戻しリストPDFを押した時刻（${jst(t)}）の年月日時分と同じ`).toContain(shown);
      expect.soft(shown, "作成日時欄は買取情報の申込日時（2026-09-30 09:31）の値ではない").not.toBe("2026-09-30 09:31");
      note("押した時刻は日本時間の年月日時分で比べた（押した直後に分が変わったときのため、押した直後の時刻の分も許した）");
    }
  });
});

// ---- 024: 数量 ----
caseTest("IT-M06-11-024", async (ctx) => {
  const p = await 手順1から5(ctx, { 対象: [ctx.notes.get(L("024"))] }, "買取番号");
  await ctx.expected(async () => {
    expect.soft(行(p, "M0611-024-Q3")?.数 ?? "（行が無い）", "「M0611-024-Q3」の数欄").toBe("3");
    expect.soft(行(p, "M0611-024-Q5")?.数 ?? "（行が無い）", "「M0611-024-Q5」の数欄").toBe("5");
  });
});

// ---- 025: 複数選択 ----
caseTest("IT-M06-11-025", async (ctx) => {
  const a = ctx.notes.get(L("025A")), b = ctx.notes.get(L("025B"));
  const p = await 手順1から5(ctx, { 範囲: ["2026-09-30 09:25:00", "2026-09-30 09:26:59"], 対象: [a, b] }, "申込日時");
  await ctx.expected(async () => {
    expect.soft(位置(p, "M0611-025-A") >= 0, "「M0611-025-A」が商品名欄に表示される").toBe(true);
    expect.soft(位置(p, "M0611-025-B") >= 0, "「M0611-025-B」が商品名欄に表示される").toBe(true);
  });
});

// ---- シングルカード（支店A・本店相当） ----
caseTest("IT-M06-11-030", CB型("030", "branch", 1500, "状態がNMの A が HP の B より先"));
caseTest("IT-M06-11-033", CB型("033", "branch", 1500, "レアリティMの A がレアリティCの B より先"));
caseTest("IT-M06-11-034", CB型("034", "branch", 1500, "色順マスターで先の色順の A が B より先"));
caseTest("IT-M06-11-035", CB型("035", "branch", 1500, "コレクター番号ソートの略称タグで、コレクター番号の小さい A が B より先"));
caseTest("IT-M06-11-036", CB型("036", "branch", 1500, "アルファベットソートの略称タグで、英語カード名の先の A が B より先"));
caseTest("IT-M06-11-037", CB型("037", "main", 500, "言語が日本語の A が英語の B より先"));
caseTest("IT-M06-11-038", CB型("038", "main", 500, "非Foilの A がFoilの B より先"));
caseTest("IT-M06-11-039", CB型("039", "main", 500, "略称タグの並び順が先の A が B より先"));
caseTest("IT-M06-11-047", CB型("047", "main", 12000, "言語が日本語の A が英語の B より先"));
caseTest("IT-M06-11-048", CB型("048", "main", 12000, "状態がNMの A が HP の B より先"));
caseTest("IT-M06-11-049", CB型("049", "main", 12000, "略称タグの並び順が先の A が B より先"));
caseTest("IT-M06-11-050", CB型("050", "main", 12000, "レアリティMの A がレアリティCの B より先"));
caseTest("IT-M06-11-051", CB型("051", "main", 12000, "色順マスターで先の色順の A が B より先"));
caseTest("IT-M06-11-052", CB型("052", "main", 12000, "コレクター番号ソートの略称タグで、コレクター番号の小さい A が B より先"));
caseTest("IT-M06-11-053", CB型("053", "main", 12000, "アルファベットソートの略称タグで、英語カード名の先の A が B より先"));
