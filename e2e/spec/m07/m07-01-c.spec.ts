/**
 * M07-01 買取検索一覧。正本: cases/M07-01_test_cases.tsv
 *
 * 依頼者の方針（2026-11-10）で、DBでの準備が要るとしていたシードを「画面で作ったデータ・既存データ」に読み替えたケース。
 * 読み替えはシードの報告（シード作成時の問題）に出る（seeds/m07-01-b.ts）。管理画面の操作は試験管理者 m0701_admin（事前準備①）。
 *
 * 共有の環境では「この N 件以外に検索条件へ一致する買取情報が無い」を作れない（ほかの買取を消さない）。
 * 買取状況などで絞るケースは「表示された行がすべて条件に合うこと」と「作った買取が表示されること」で確かめ、注記に残す。
 * 注文者名で絞るケースは、注文者名を実行の印つきにしたので、作った買取だけが出る。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { scene, DBで読み取った値を撮る, ダウンロードしたCSVの内容を撮る } from "../../lib/evidence_other";
import { CSVを読む, 戻しリストを読む, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { M0701ListPage } from "../../pages/admin/m07_01_list";
import { M0701_ADMIN } from "../../seeds/m07-01";
import { 注文者名 } from "../../seeds/m07-01-b";
import { 品 } from "../../seeds/m07-03-b";
import { 選んで買取の明細ID } from "../../seeds/m07-db-prep";
import { 戻しリスト用の商品属性, 棚戻し済みか, 買取状況マスタの表示順, 高額商品閾値 } from "../../db/m07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 数字 = (s: string) => s.replace(/[^\d]/g, "");
const 番 = (n: string) => String(Number(n));

async function 始める(page: Page): Promise<M0701ListPage> {
  await loginAdmin(page, M0701_ADMIN);
  return new M0701ListPage(page);
}

/** 実行日（日本時間）から n か月前の日付（yyyy-MM-dd。月末のあふれはアプリの日付計算と同じく翌月へ送る） */
function 月前(n: number): string {
  const jst = new Date(Date.now() + 9 * 3600_000);
  const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth() - n, jst.getUTCDate()));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const 共有の環境 = "共有の環境ではほかの買取を消さないので、条件に合うほかの買取も一覧に出る。表示された行（1ページ目）がすべて条件に合うことと、作った買取が表示されることを確かめた";

caseTest("IT-M07-01-001", async ({ page, step, expected }) => {
  const l = await 始める(page);
  await step(1, async () => { await l.open(); });
  await expected(async () => {
    const 期待 = 月前(3);
    expect.soft(数字(await l.日付の値("request", "from")), `買取依頼日(From)（実行日の3か月前 ${期待}）`).toBe(数字(期待));
    expect.soft(await l.選択中の買取状況(), "選択中の買取状況").toEqual([]);
    expect.soft(await l.ANDOR検索の選択数(), "AND/OR検索の選ばれている数").toBe(0);
    expect.soft(await l.本人確認の選択数(), "本人確認の選ばれている数").toBe(0);
    await expect.soft(l.結果の表の行(), "検索結果一覧の行").toHaveCount(0);
    await expect.soft(l.ページング(), "ページング").toHaveCount(0);
  });
});

caseTest("IT-M07-01-002", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取番号-M0701-002〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.買取番号を入れる(番号);
    await l.検索する();
    await expect(l.行の(番号), "検索結果の対象の行").toBeVisible({ timeout: 30_000 });
  });
  await step(3, async () => { await l.メニューから開き直す(); });
  await expected(async () => {
    expect.soft(await l.買取番号の欄().inputValue(), "買取番号の入力欄（検索条件が破棄される）").toBe("");
    await expect.soft(l.結果の表の行(), "検索結果一覧の行（初期表示の一覧なし）").toHaveCount(0);
    await expect.soft(l.ページング(), "ページング（初期表示の一覧なし）").toHaveCount(0);
  });
});

caseTest("IT-M07-01-004", async ({ page, step, expected }) => {
  const l = await 始める(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取状況の選択肢を開く(); });
  await expected(async () => {
    const 選択肢 = await l.買取状況の選択肢();
    const 期待の並び = 買取状況マスタの表示順();
    note(`期待の並びは、買取状況マスタの表示順の昇順（DBの読み取り）: ${期待の並び.join("、")}`);
    expect.soft(選択肢.includes("未登録在庫あり") && 選択肢.includes("入庫待ち"), "選択肢に未登録在庫ありと入庫待ちがある").toBe(true);
    expect.soft(選択肢, "買取状況の選択肢の並び（マスタの表示順の昇順）").toEqual(期待の並び);
  });
});

caseTest("IT-M07-01-005", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取番号-M0701-005A〕"), B = notes.get("〔買取番号-M0701-005B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取状況を選ぶ(["未登録在庫あり", "入庫待ち"]); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    const rows = await l.行();
    note(共有の環境);
    note(`1ページ目の行 ${rows.length} 件（うち作った買取以外 ${rows.filter((r) => r.番号 !== 番(A) && r.番号 !== 番(B)).length} 件）。該当件数 ${await l.該当件数()}`);
    expect.soft(rows.some((r) => r.番号 === 番(A)), `買取番号〔買取番号-M0701-005A〕（${買取番号の表示(A)}）が表示される`).toBe(true);
    expect.soft(rows.some((r) => r.番号 === 番(B)), `買取番号〔買取番号-M0701-005B〕（${買取番号の表示(B)}）が表示される`).toBe(true);
    expect.soft(rows.filter((r) => !["未登録在庫あり", "入庫待ち"].includes(r.買取状況)).map((r) => `${r.買取番号}:${r.買取状況}`), "未登録在庫あり・入庫待ち以外の買取状況の行").toEqual([]);
  });
});

caseTest("IT-M07-01-006", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取番号-M0701-006A〕"), B = notes.get("〔買取番号-M0701-006B〕"), C = notes.get("〔買取番号-M0701-006C〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.戻し未完了のみ表示(true); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    const rows = await l.行();
    note(共有の環境);
    note(`〔買取番号-M0701-006C〕は A・B より後に作ったので番号が大きい。一覧は買取番号の降順なので、もし表示されるなら A・B と同じページの前に出る。1ページ目に A・B があり C が無いことで、C が表示されないことを確かめた（該当件数 ${await l.該当件数()}）`);
    const nums = rows.map((r) => Number(r.番号));
    expect.soft(nums.every((n, i) => i === 0 || nums[i - 1] > n), "一覧が買取番号の降順に並ぶ（C が出るなら A・B より前に出ることの前提）").toBe(true);
    expect.soft(rows.some((r) => r.番号 === 番(A)), `棚戻し未の〔買取番号-M0701-006A〕（${買取番号の表示(A)}）が表示される`).toBe(true);
    expect.soft(rows.some((r) => r.番号 === 番(B)), `棚戻し未の〔買取番号-M0701-006B〕（${買取番号の表示(B)}）が表示される`).toBe(true);
    expect.soft(!rows.some((r) => r.番号 === 番(C)), `棚戻し済みの〔買取番号-M0701-006C〕（${買取番号の表示(C)}）が表示されない`).toBe(true);
  });
});

caseTest("IT-M07-01-008", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取番号-M0701-008A〕"), B = notes.get("〔買取番号-M0701-008B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取状況を選ぶ(["注文", "商品到着"]); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    const rows = await l.行();
    note(共有の環境);
    note(`1ページ目の行 ${rows.length} 件。該当件数 ${await l.該当件数()}`);
    expect.soft(rows.filter((r) => !["注文", "商品到着"].includes(r.買取状況)).map((r) => `${r.買取番号}:${r.買取状況}`), "注文・商品到着以外の買取状況の行").toEqual([]);
    expect.soft(rows.some((r) => r.番号 === 番(A)), `注文の〔買取番号-M0701-008A〕（${買取番号の表示(A)}）が表示される`).toBe(true);
    expect.soft(rows.some((r) => r.番号 === 番(B)), `商品到着の〔買取番号-M0701-008B〕（${買取番号の表示(B)}）が表示される`).toBe(true);
  });
});

caseTest("IT-M07-01-011", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const ns = ["A", "B", "C", "D"].map((x) => notes.get(`〔買取番号-M0701-011${x}〕`));
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => {
    expect(await l.日付の値("arrival", "from"), "商品到着日(From)が空").toBe("");
    expect(await l.日付の値("arrival", "to"), "商品到着日(To)が空").toBe("");
    await l.検索する();
  });
  await expected(async () => {
    const rows = await l.行();
    note("共有の環境ではほかの買取を消さないので、条件を付けない検索はすべての買取が出る。作った4件はいちばん新しいので1ページ目に出る前提で、4件が表示されることを確かめた");
    note(`該当件数 ${await l.該当件数()}`);
    ns.forEach((n, i) => expect.soft(rows.some((r) => r.番号 === 番(n)), `〔買取番号-M0701-011${"ABCD"[i]}〕（${買取番号の表示(n)}）が表示される`).toBe(true));
  });
});

caseTest("IT-M07-01-042", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const 番号 = notes.get("〔買取番号-M0701-042〕");
  let リンクの文 = "";
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.買取状況を選ぶ(["商品到着"]);
    await l.日付を入れる("request", "from", "2026-08-01");
    await l.注文者名を入れる("山田");
    note("買取依頼日(From)の欄の書式は yyyy-MM-dd なので「2026-08-01」と入れた（正本の 2026/08/01）");
    await l.検索する();
  });
  await step(3, async () => { リンクの文 = await l.依頼者氏名を押す(番号); });
  await expected(async () => {
    expect.soft((await l.注文者名の欄().inputValue()).replace(/ /g, " ").trim(), "注文者名の欄（押した買取依頼者氏名）").toBe(リンクの文);
    expect.soft(リンクの文.replace(/\s/g, ""), "押したリンクの買取依頼者氏名").toBe("山田太郎");
    expect.soft(await l.選択中の買取状況(), "選択中の買取状況（未選択になる）").toEqual([]);
    expect.soft(数字(await l.日付の値("request", "from")), "買取依頼日(From)（2026/08/01 のまま）").toBe("20260801");
    expect.soft((await l.行()).some((r) => r.番号 === 番(番号)), "再検索した買取一覧に〔買取番号-M0701-042〕が表示される").toBe(true);
  });
});

caseTest("IT-M07-01-044", async ({ page, step, expected }) => {
  const l = await 始める(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる("123"); await l.検索する(); });
  await step(3, async () => { await l.編集画面を開く("123"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（ID 123 の買取編集画面）").toMatch(/\/purchase\/123\/edit$/);
    await expect.soft(page.locator("#admin_purchase_detail_BuyOrderStatus"), "買取編集画面の買取状況の欄").toBeVisible();
  });
});

caseTest("IT-M07-01-055", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  const A = notes.get("〔買取番号-M0701-055A〕"), B = notes.get("〔買取番号-M0701-055B〕");
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  let file: Awaited<ReturnType<M0701ListPage["ダウンロードを押す"]>>["file"] = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる(注文者名("入金出力試験")); await l.検索する(); });
  await step(3, async () => { await l.対象にする(B); await l.対象にする(A); });
  await step(4, async () => {
    const r = await l.ダウンロードを押す("入金CSV");
    file = r.file;
    expect(file, `入金CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    await l.ダウンロードの選択肢を閉じる();
  });
  await step(5, async () => {
    csv = await CSVを読む(file!);
    // ダウンロードの選択肢を閉じてから撮る。CSVの値は、試験が読み取った内容の枠に書き出して撮る（検索欄のラベルと取り違えない）
    await l.ダウンロードの選択肢を閉じる();
    const 見出し = csv.見出し;
    await ダウンロードしたCSVの内容を撮る(page, [見出し, ...csv.行.map((r) => 見出し.map((k) => r[k] ?? ""))], scene.stepLabel(5, "ダウンロードしたCSVの内容"));
  });
  await expected(async () => {
    const rows = csv!.行;
    note("振込金額はシード表に値が無いので、送料＋査定額（A 10000・B 8000）と読んだ。口座種別・オンライン本人確認区分はシード表の表示名（普通・当座、オンライン本人確認済み・簡易書留確認済み）で比べた");
    expect.soft(rows.map((r) => 番(r["受注番号"] ?? "")), "受注番号の並び（買取番号順）").toEqual([番(A), 番(B)]);
    const 期待 = [
      { 番号: A, 送料: "500", 査定額: "9500", 銀行名: "晴銀行", 支店名: "本店", 口座種別: "普通", 口座番号: "0012345", 名義: "ヤマダタロウ", 振込金額: "10000", 本人確認: "オンライン本人確認済み" },
      { 番号: B, 送料: "0", 査定額: "8000", 銀行名: "曇銀行", 支店名: "中央支店", 口座種別: "当座", 口座番号: "0000777", 名義: "サトウハナコ", 振込金額: "8000", 本人確認: "簡易書留確認済み" },
    ];
    for (const [i, e] of 期待.entries()) {
      const r = rows.find((x) => 番(x["受注番号"] ?? "") === 番(e.番号));
      const tag = `〔買取番号-M0701-055${"AB"[i]}〕`;
      expect.soft(r ? 数字(r["送料"]) : "（行が無い）", `${tag} の送料`).toBe(e.送料);
      expect.soft(r ? 数字(r["査定額"]) : "（行が無い）", `${tag} の査定額`).toBe(e.査定額);
      expect.soft(r?.["銀行名"] ?? "（行が無い）", `${tag} の銀行名`).toBe(e.銀行名);
      expect.soft(r?.["支店名"] ?? "（行が無い）", `${tag} の支店名`).toBe(e.支店名);
      expect.soft(r?.["口座種別"] ?? "（行が無い）", `${tag} の口座種別`).toBe(e.口座種別);
      expect.soft(r?.["口座番号"] ?? "（行が無い）", `${tag} の口座番号`).toBe(e.口座番号);
      expect.soft(r?.["受取人口座名義"] ?? "（行が無い）", `${tag} の受取人口座名義`).toBe(e.名義);
      expect.soft(r ? 数字(r["振込金額"]) : "（行が無い）", `${tag} の振込金額`).toBe(e.振込金額);
      // CSVの列の値であり、検索欄の本人確認のチェックの名前ではない。同じ文字の検索欄のラベルを指さないよう、列名つきの文で比べる
      expect.soft(`CSVの「オンライン本人確認区分」列=「${r?.["オンライン本人確認区分"] ?? "（行が無い）"}」`, `${tag} のCSVのオンライン本人確認区分の列`).toBe(`CSVの「オンライン本人確認区分」列=「${e.本人確認}」`);
    }
  });
});

/** 設計 M07-08（0206）のピッキング区分: 基準価格と本店の閾値（●●円未満、●●円以上▲▲円未満、■■円以上）。閾値が1つも無ければ空 */
function ピッキング区分(価格: number, 閾値: string[]): string {
  const t = [...new Set(閾値.filter((x) => x !== "").map(Number))].sort((a, b) => a - b);
  const 円 = (n: number) => n.toLocaleString("en-US");
  if (t.length === 0) return "";
  if (価格 < t[0]) return `${円(t[0])}円未満`;
  for (let i = 0; i < t.length - 1; i++) if (価格 >= t[i] && 価格 < t[i + 1]) return `${円(t[i])}円以上${円(t[i + 1])}円未満`;
  return `${円(t[t.length - 1])}円以上`;
}

/** 戻しリスト（059〜064）: 注文者名で検索 → 対象にチェック → 出力 → 5つ目の手順（CSVを開く・戻しリストを見る・DBの棚戻し済みフラグ） */
type 戻しの種類 = "CSVの中身" | "PDFの中身" | "CSVで棚戻し" | "PDFで棚戻し" | "状態のエラー";
function 戻しリスト(n: string, 項目: "戻しリストCSV" | "戻しリストPDF", 種類: 戻しの種類): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const l = await 始める(page);
    const 番号 = notes.get(`〔買取番号-M0701-${n}〕`);
    let r!: Awaited<ReturnType<M0701ListPage["ダウンロードを押す"]>>;
    let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
    let pdf: Awaited<ReturnType<typeof 戻しリストを読む>> | null = null;
    let 棚戻し: boolean | null = null;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.注文者名を入れる(注文者名("戻し基本試験")); await l.検索する(); });
    await step(3, async () => { await l.対象にする(番号); });
    await step(4, async () => { r = await l.ダウンロードを押す(項目); });
    if (種類 !== "状態のエラー") {
      await step(5, async () => {
        if (種類 === "CSVの中身") {
          expect(r.file, `戻しリストCSVのファイル（応答 ${r.応答}）`).not.toBeNull();
          csv = await CSVを読む(r.file!);
          await l.ダウンロードの選択肢を閉じる();
          await ダウンロードしたCSVの内容を撮る(page, [csv.見出し, ...csv.行.map((x) => csv!.見出し.map((k) => x[k] ?? ""))], scene.stepLabel(5, "ダウンロードした戻しリストCSVの内容"));
        }
        if (種類 === "PDFの中身") { expect(r.popup, "戻しリストの別ウィンドウ").not.toBeNull(); pdf = await 戻しリストを読む(r.popup!); }
        if (種類 === "CSVで棚戻し" || 種類 === "PDFで棚戻し") 棚戻し = 棚戻し済みか(番号);
      });
    }
    await expected(async () => {
      const カード = 品(`M0701-R${n}-C`), サプライ = 品(`M0701-R${n}-S`), 明細 = 品(`M0701-${n}-FB`);
      if (種類 === "CSVの中身") {
        const rows = csv!.行;
        note("実在庫は、通常商品（既存のカードを指定したグッズ商品）2・サプライ3。買取明細は申込みの商品（売却しない）。正本の前提「戻しリスト用の商品属性」のうち、棚番号・略称タグは共有のマスタに足さないので設定していない（空で出る）。そのため棚番号の表示と、略称が出ることは確かめられない（確かめたのは、設定していない略称・棚番号が空で出ること）。通常商品の色・レアリティはカード検索の1件目のカードのものなので、DBのカードの色・レアリティと同じに出ることで確かめた");
        expect.soft(csv!.見出し, "CSVの見出し").toEqual(["ピッキング区分", "棚番号", "言語/状態", "略称", "色/R", "数", "商品名", "基準価格"]);
        expect.soft(rows.length, "データ行の数（実在庫2件）").toBe(2);
        const c = rows.find((x) => (x["商品名"] ?? "").includes(カード)), s = rows.find((x) => (x["商品名"] ?? "").includes(サプライ));
        const ac = 戻しリスト用の商品属性(カード), as = 戻しリスト用の商品属性(サプライ);
        expect.soft(ac?.カード指定 && as?.カード指定 === false, "前提: 通常商品はカード指定あり・サプライ品はカード指定なし").toBe(true);
        // 通常商品: 設計 M07-08（0206）の書式。言語/状態＝Foilの場合はFoilをつけて「言語/状態」（例 FoilJP/NM）、色/R＝色＋レアリティ（例 金R）、ピッキング区分＝基準価格と本店の閾値
        expect.soft(c?.["数"] ?? "（行が無い）", "実在庫の通常商品の行の数").toBe("2");
        expect.soft(c?.["言語/状態"] ?? "（行が無い）", "実在庫の通常商品の行の言語/状態（日本語・ニアミント。Foilならつく）").toBe(`${ac?.フォイル ? "Foil" : ""}JP/NM`);
        expect.soft(c?.["ピッキング区分"] ?? "（行が無い）", `実在庫の通常商品の行のピッキング区分（基準価格${ac?.基準価格}円・本店の閾値 ${高額商品閾値().join("/")}）`).toBe(ピッキング区分(Number(ac?.基準価格), 高額商品閾値()));
        expect.soft(c?.["色/R"] ?? "（行が無い）", "実在庫の通常商品の行の色/R（カードの色＋レアリティ）").toBe(`${ac?.色 ?? ""}${ac?.レアリティ ?? ""}`);
        expect.soft(c?.["略称"] ?? "（行が無い）", "実在庫の通常商品の行の略称（略称タグは設定していないので空）").toBe(ac?.略称 ?? "");
        expect.soft(c?.["棚番号"] ?? "（行が無い）", "実在庫の通常商品の行の棚番号（棚番号は設定していないので空）").toBe(ac?.棚番号 ?? "");
        expect.soft(c?.["商品名"] ?? "（行が無い）", "実在庫の通常商品の行の商品名（略称・言語・状態・色・レアリティを取り除いたもの）").toBe(カード);
        expect.soft(c ? 数字(c["基準価格"]) : "（行が無い）", "実在庫の通常商品の行の基準価格").toBe("1000");
        // サプライ品: ピッキング区分「サプライ」・言語/状態「サプライ品」・略称と色/Rは出さない
        expect.soft(s?.["数"] ?? "（行が無い）", "実在庫のサプライの行の数").toBe("3");
        expect.soft(s?.["ピッキング区分"] ?? "（行が無い）", "実在庫のサプライの行のピッキング区分").toBe("サプライ");
        expect.soft(s?.["言語/状態"] ?? "（行が無い）", "実在庫のサプライの行の言語/状態").toBe("サプライ品");
        expect.soft(s?.["略称"] ?? "（行が無い）", "実在庫のサプライの行の略称（サプライ品は表示しない）").toBe("");
        expect.soft(s?.["色/R"] ?? "（行が無い）", "実在庫のサプライの行の色/R（サプライ品は出さない）").toBe("");
        expect.soft(s?.["商品名"] ?? "（行が無い）", "実在庫のサプライの行の商品名").toBe(サプライ);
        expect.soft(s ? 数字(s["基準価格"]) : "（行が無い）", "実在庫のサプライの行の基準価格").toBe("1000");
        expect.soft(rows.filter((x) => (x["商品名"] ?? "").includes(明細)).length, "買取明細（申込みの商品）の行（実在庫に無いので出ない）").toBe(0);
      } else if (種類 === "PDFの中身") {
        const rows = pdf!.行;
        note("実在庫は、通常商品（既存のカードを指定したグッズ商品）2・サプライ3。買取明細は申込みの商品（売却しない）。棚番号・略称タグは共有のマスタに足さないので設定していない（棚番号の表示は確かめられない）");
        const c = rows.find((x) => x.商品名.includes(カード)), s = rows.find((x) => x.商品名.includes(サプライ));
        expect.soft(rows.length, "戻しリストの明細の行の数（実在庫2件）").toBe(2);
        expect.soft(c?.数 ?? "（行が無い）", "実在庫の通常商品の行の数").toBe("2");
        expect.soft(c ? 数字(c.価格) : "（行が無い）", "実在庫の通常商品の行の価格").toBe("1000");
        expect.soft(s?.数 ?? "（行が無い）", "実在庫のサプライの行の数").toBe("3");
        expect.soft(s ? 数字(s.価格) : "（行が無い）", "実在庫のサプライの行の価格").toBe("1000");
        expect.soft(rows.every((x) => x.仕訳 !== ""), "各行に商品仕訳の見出しがある").toBe(true);
        expect.soft(rows.every((x) => /^\d+$/.test(x.No)), "各行に行番号がある").toBe(true);
        expect.soft(/\d+\s*\/\s*\d+/.test(pdf!.全文), "ページング（n/m）が表示される").toBe(true);
        expect.soft(/全\s*\d+\s*[点個]/.test(pdf!.全文), "ページ内個数小計（全N 点）が表示される").toBe(true);
        expect.soft(rows.filter((x) => x.商品名.includes(明細)).length, "買取明細（申込みの商品）の行（実在庫に無いので出ない）").toBe(0);
      } else if (種類 === "CSVで棚戻し" || 種類 === "PDFで棚戻し") {
        expect.soft(種類 === "CSVで棚戻し" ? r.file !== null : r.popup !== null, `${項目}が出力された`).toBe(true);
        expect.soft(棚戻し, "DBの、買取番号の棚戻し済みフラグ（棚戻し済み）").toBe(true);
      } else {
        const 表示 = 買取番号の表示(番号);
        await expect.soft(page.locator(".alert-danger").filter({ hasText: 表示 }).first(), `買取番号 ${表示} のエラーの通知が画面に表示される`).toBeVisible({ timeout: 30_000 });
        const msgs = await l.エラーの通知();
        note(`画面上部のエラーの通知: ${msgs.join(" / ") || "（無い）"}`);
        expect.soft(msgs.some((m) => m.includes(表示) && m.includes("入庫待ち") && m.includes("入庫済み")), "入庫待ち・入庫済みでない買取を選んだ旨のエラー").toBe(true);
        expect.soft(r.file === null && r.popup === null, "戻しリストは出力されない").toBe(true);
      }
    });
  };
}
caseTest("IT-M07-01-059", 戻しリスト("059", "戻しリストCSV", "CSVの中身"));
caseTest("IT-M07-01-060", 戻しリスト("060", "戻しリストCSV", "CSVで棚戻し"));
caseTest("IT-M07-01-061", 戻しリスト("061", "戻しリストPDF", "PDFの中身"));
caseTest("IT-M07-01-062", 戻しリスト("062", "戻しリストPDF", "PDFで棚戻し"));
caseTest("IT-M07-01-063", 戻しリスト("063", "戻しリストCSV", "状態のエラー"));
caseTest("IT-M07-01-064", 戻しリスト("064", "戻しリストPDF", "状態のエラー"));

caseTest("IT-M07-01-070", async ({ page, step, expected }) => {
  const l = await 始める(page);
  const 欄 = [["assessing", "査定開始日"], ["transfer_request", "振込依頼日"], ["cancellation", "キャンセル日"]] as const;
  const 値: { 名: string; 値: string }[] = [];
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    for (const [k, 名] of 欄) for (const 端 of ["from", "to"] as const) 値.push({ 名: `${名}(${端 === "from" ? "From" : "To"})`, 値: await l.日付の値(k, 端) });
  });
  await expected(async () => {
    for (const v of 値) expect.soft(v.値, `${v.名}の初期値（空白）`).toBe("");
  });
});

caseTest("IT-M07-01-080", async ({ page, notes, step, expected }) => {
  const l = await 始める(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.検索条件をクリアする(); });
  await step(3, async () => { await l.注文者名を入れる(注文者名("M0701-080-X")); await l.検索する(); });
  await step(4, async () => { await expect(l.結果の表の行().first(), "検索結果の行").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const rows = await l.行();
    for (const [x, 状況] of [["A", "振込依頼済み"], ["B", "査定内容連絡済み"], ["C", "キャンセル済み"]] as const) {
      const n = 番(notes.get(`〔買取番号-M0701-080${x}〕`));
      expect.soft(rows.find((r) => r.番号 === n)?.買取状況 ?? "（行が無い）", `買取番号〔買取番号-M0701-080${x}〕の買取状況`).toBe(状況);
    }
  });
});

/** 買取商品一覧CSV（089〜095）: 注文者名で検索 → 対象にチェック → 出力 → 開く。期待はデータ行（商品コード×在庫増減数。正本のコードに実行の印） */
function 商品一覧CSV(姓の正本: string, 対象: string[], 期待: [string, string][], 順を見る: boolean, 出ない: string[] = [], 明細の登録順?: { 買取番号: string; 先: string; 後: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const l = await 始める(page);
    let file: Awaited<ReturnType<M0701ListPage["ダウンロードを押す"]>>["file"] = null;
    let rows: Record<string, string>[] = [];
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.注文者名を入れる(注文者名(姓の正本)); await l.検索する(); });
    await step(3, async () => { for (const t of 対象) await l.対象にする(notes.get(t)); });
    await step(4, async () => {
      const r = await l.ダウンロードを押す("買取商品一覧CSV");
      file = r.file;
      expect(file, `買取商品一覧CSVのファイル（応答 ${r.応答}・警告 ${r.ダイアログ.join(" / ")}）`).not.toBeNull();
    });
    let 明細ID: { 先: number; 後: number } | null = null;
    await step(5, async () => {
      rows = (await CSVを読む(file!)).行;
      if (明細の登録順) {
        // 正本の前提「商品IDの大きい方（X2）の明細を先に登録」を、明細IDの順（作られた順）をDBで読んで示す
        const 番 = notes.get(明細の登録順.買取番号);
        明細ID = { 先: Number(選んで買取の明細ID(番, 品(明細の登録順.先))), 後: Number(選んで買取の明細ID(番, 品(明細の登録順.後))) };
        await DBで読み取った値を撮る(page, `買取番号 ${番} の選んで買取の明細ID（作られた順）`, [["商品コード", "明細ID"], [`${明細の登録順.先}（商品IDの大きい方）`, String(明細ID.先)], [`${明細の登録順.後}（商品IDの小さい方）`, String(明細ID.後)]], scene.stepLabel(5, "DBで読み取った明細IDの順"));
      }
    });
    await expected(async () => {
      if (明細の登録順) expect.soft(明細ID !== null && (明細ID as { 先: number; 後: number }).先 < (明細ID as { 先: number; 後: number }).後, `前提: 商品IDの大きい方（${明細の登録順.先}）の明細IDが小さい方（${明細の登録順.後}）より小さい（先に登録された）`).toBe(true);
      const 実際 = rows.map((r) => `${r["商品コード"] ?? ""}×${r["在庫増減数"] ?? ""}`);
      const 期待の行 = 期待.map(([c, q]) => `${品(c)}×${q}`);
      expect.soft(rows.length, "CSVのデータ行の数").toBe(期待.length);
      if (順を見る) expect.soft(実際, "CSVのデータ行と並び（商品コード×在庫増減数）").toEqual(期待の行);
      else expect.soft([...実際].sort(), "CSVのデータ行（商品コード×在庫増減数。順は問わない）").toEqual([...期待の行].sort());
      for (const c of 出ない) expect.soft(rows.filter((r) => r["商品コード"] === 品(c)).length, `商品コード ${c} の行（出力されない）`).toBe(0);
    });
  };
}
caseTest("IT-M07-01-089", 商品一覧CSV("M0701-089-X", ["〔買取番号-M0701-089A〕"], [["M0701-089-A-OK", "2"]], true, ["M0701-089-A-NG", "M0701-089-B-OK", "M0701-089-B-NG"]));
caseTest("IT-M07-01-090", 商品一覧CSV("M0701-090-X", ["〔買取番号-M0701-090A〕", "〔買取番号-M0701-090B〕"], [["M0701-090-A-OK", "2"], ["M0701-090-B-OK", "3"]], false, ["M0701-090-A-NG", "M0701-090-B-NG"]));
caseTest("IT-M07-01-091", 商品一覧CSV("M0701-091-X", ["〔買取番号-M0701-091〕"], [["M0701-091-OK", "2"]], true, ["M0701-091-UNDECIDED"]));
caseTest("IT-M07-01-093", 商品一覧CSV("M0701-CB093-X", ["〔買取番号-M0701-093〕"], [["M0701-CB093-Y", "2"], ["M0701-CB093-X2", "3"]], true, [], { 買取番号: "〔買取番号-M0701-093〕", 先: "M0701-CB093-X2", 後: "M0701-CB093-Y" }));
caseTest("IT-M07-01-095", 商品一覧CSV("M0701-CB095-X", ["〔買取番号-M0701-095〕"], [["M0701-CB095-P", "2"], ["M0701-CB095-P", "3"]], false));
