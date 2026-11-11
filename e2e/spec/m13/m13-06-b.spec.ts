/**
 * M13-06 イベント申込一覧（検索入力）の追加分（イベント情報検索・一覧の表示・一括更新・デッキ登録の行）。正本: cases/M13-06_test_cases.tsv
 * 決め打ちの識別の値（イベント名・検索語・会員の姓）は rc() で実行ごとの印を付ける。
 * 032（12001件の大量データ）は実装しない。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 申込の申込履歴の件数, 申込の申込状況 } from "../../db/m13_07";
import { EntryListPage, 結果の行 } from "../../pages/admin/m13_06_entry_list";
import { BulkEditPage } from "../../pages/admin/m13_07_bulk_edit";
import { M1306_ADMIN } from "../../seeds/m13-06";
import { モーダル005, モーダル006の語, 晴屋031, 晴大会, 申込023, 申込日時062, 申込日時067 } from "../../seeds/m13-06-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ymd = (s: string) => s.slice(0, 10).replace(/-/g, "/");

async function ログインして開く(page: CaseCtx["page"]): Promise<EntryListPage> {
  await loginAdmin(page, M1306_ADMIN);
  return new EntryListPage(page);
}
/** イベント名を入れ、検索種別を選んで検索する（店舗・開始時間は初期表示のまま。入っていた値は注記に残す） */
async function 名前で検索する(list: EntryListPage, 語: string, 種別: "イベント申込を検索" | "デッキ登録を検索", 開始時間を空にする = false): Promise<void> {
  await list.開く();
  await list.イベント名.fill(語);
  await list.検索種別(種別).check();
  if (開始時間を空にする) await list.開始時間From.fill("");
  note(`開始時間(From)は「${await list.開始時間From.inputValue() || "空"}」、店舗は「${(await list.選ばれている店舗()).join("・") || "指定なし"}」で検索した。シードの日程の開催日は、実行した日以後になるよう年だけ読み替えた`);
  await list.検索する();
}
const 申込IDの行 = (rows: 結果の行[], id: string) => rows.filter((r) => r.申込ID === id);

// ================= イベント情報検索（モーダル） =================

caseTest("IT-M13-06-005", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const n = モーダル005();
  await step(1, async () => { await list.開く(); await list.モーダルを開く(); });
  await step(2, async () => {
    await list.モーダルのイベント名.fill(n.語);
    await list.モーダルの店舗.selectOption({ label: "新宿店" });
    await list.日付を入れる(list.モーダルの開催日From, "2026/09/01");
    await list.日付を入れる(list.モーダルの開催日To, "2026/09/30");
    await list.モーダルで検索する();
  });
  await expected(async () => {
    const ids = await list.モーダルの日程ID();
    const text = await list.モーダルの結果.innerText();
    expect.soft(ids.length, "一覧に表示された日程の数（新宿店・オンライン受付ありの1件）").toBe(1);
    expect.soft(text, "新宿店・オンライン受付ありのイベントが表示される").toContain(n.A);
    expect.soft(text, "オンライン受付なしのイベントが表示されない").not.toContain(n.B);
    expect.soft(text, "池袋店のイベントが表示されない").not.toContain(n.C);
  });
  note("シード表のイベント名は検索語（印つき）にA・B・Cを付けた3件。検索語は印つきの値");
});

caseTest("IT-M13-06-006", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => {
    await list.開く(); await list.モーダルを開く();
    await list.モーダルのイベント名.fill(モーダル006の語());
    note(`モーダルの開催日(From)は初期値「${await list.モーダルの開催日From.inputValue()}」のまま、店舗は「${await list.モーダルで選ばれている店舗()}」のまま検索した。シードの日程の開催日は、実行した日以後になるよう年だけ読み替えた`);
    await list.モーダルで検索する();
  });
  let p1: string[] = []; let p2: string[] = [];
  await step(2, async () => { p1 = await list.モーダルの日程ID(); });
  await step(3, async () => { await list.モーダルのページを開く(2); p2 = await list.モーダルの日程ID(); });
  await expected(async () => {
    expect.soft(p1.length, "1ページ目に表示された日程の数").toBe(10);
    expect.soft(p2.length, "2ページ目に表示された日程の数").toBe(2);
    expect.soft(p2.filter((x) => p1.includes(x)).length, "1ページ目と2ページ目で重なる日程の数").toBe(0);
  });
});

caseTest("IT-M13-06-056", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const e = notes.get("〔イベントID-M1306-056〕"), d = notes.get("〔日程ID-M1306-056〕");
  await step(1, async () => { await list.開く(); await list.モーダルを開く(); });
  await step(2, async () => {
    await list.モーダルのイベント名.fill(rc("M1306-056"));
    await list.モーダルの店舗.selectOption({ label: "池袋店" });
    await list.日付を入れる(list.モーダルの開催日From, "2026/09/01");
    await list.日付を入れる(list.モーダルの開催日To, "2026/09/30");
    await list.モーダルで検索する();
  });
  await expected(async () => {
    const ids = await list.モーダルの日程ID();
    expect.soft(ids, `編集権限のない池袋店の日程ID ${d} が一覧に表示されない`).not.toContain(d);
    expect.soft(ids.length, "一覧に表示された日程の数（0件）").toBe(0);
    expect.soft(await list.モーダルのイベント行(e).count(), `イベントID ${e} の行の数`).toBe(0);
  });
});

// ================= 一覧の表示 =================

caseTest("IT-M13-06-023", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const [A, B, C] = (["A", "B", "C"] as const).map((x) => notes.get(`〔申込ID-M1306-023${x}〕`));
  await step(1, async () => {
    await list.開く();
    await list.イベント名.fill(申込023.語());
    await list.検索種別("イベント申込を検索").check();
    await list.店舗を選ぶ([]);
    note("店舗の初期値は「新宿店」だが、期待結果は池袋店の申込も含めて3件表示されるので、手順に無い店舗の指定は外して検索した。開始時間(From)は初期表示のまま（シードの日程は実行した日以後の開催日）");
    await list.検索する();
  });
  let rows: 結果の行[] = []; let 件数: number | null = null;
  await step(2, async () => { rows = await list.行を読む(); 件数 = await list.該当件数(); });
  await expected(async () => {
    expect.soft(件数 ?? rows.length, "該当件数").toBe(3);
    const a = 申込IDの行(rows, A)[0], b = 申込IDの行(rows, B)[0], c = 申込IDの行(rows, C)[0];
    for (const [x, r, 店舗, 姓] of [["A", a, "新宿店", 申込023.姓("A")], ["C", c, "池袋店", 申込023.姓("C")]] as const) {
      expect.soft(r?.申込ID, `申込${x}の申込ID`).toBeTruthy();
      expect.soft(r?.プレイヤー欄 ?? "", `申込${x}のプレイヤー名、デッキ登録状況`).toContain(姓);
      expect.soft(r?.プレイヤー欄 ?? "", `申込${x}のデッキ登録状況`).toContain("デッキ未登録");
      expect.soft(r?.イベント欄 ?? "", `申込${x}のイベント名・店舗`).toContain(店舗);
      expect.soft(r?.イベント欄 ?? "", `申込${x}の開催日`).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect.soft(r?.申込欄 ?? "", `申込${x}の申込日時`).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
      expect.soft(r?.申込欄 ?? "", `申込${x}の支払番号`).toContain(申込023.支払番号(x));
    }
    expect.soft(b?.チェックあり, "新宿店の申込Bのチェックボックス").toBe(true);
    expect.soft(a?.チェックあり, "新宿店の申込Aのチェックボックスが表示される").toBe(true);
    expect.soft(c?.チェックあり, "編集権限のない池袋店の申込Cのチェックボックスが表示されない").toBe(false);
  });
});

caseTest("IT-M13-06-030", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-030〕");
  await step(1, async () => { await 名前で検索する(list, 晴大会("030"), "イベント申込を検索"); });
  await step(2, async () => {
    const row = 申込IDの行(await list.行を読む(), id)[0];
    if (!row) throw new Error(`検索結果に申込ID ${id} の行が無い`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), row.行.locator(":scope > td").nth(2).locator("a").first().click({ timeout: 30_000 })]);
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移した画面（イベント申込詳細・編集）").toMatch(new RegExp(`/event/entry/${id}/edit$`));
  });
  note("手順の検索語「晴大会」は、ほかのシードと混ざらないよう印つきの「晴大会030」を使った（イベント名もこの値）");
});

caseTest("IT-M13-06-031", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-031〕");
  const 氏名 = `${晴屋031.姓()} ${晴屋031.名}`;
  let 申込側 = { 押せた: false, 遷移先: "" };
  let デッキ側 = { 押せた: false, 遷移先: "" };
  const デッキ表示を押す = async (row: 結果の行 | undefined): Promise<{ 押せた: boolean; 遷移先: string }> => {
    if (!row) return { 押せた: false, 遷移先: "（行が無い）" };
    const btn = row.行.getByRole("link", { name: "デッキ表示", exact: true }).or(row.行.getByRole("button", { name: "デッキ表示", exact: true }));
    if ((await btn.count()) === 0) return { 押せた: false, 遷移先: new URL(page.url()).pathname };
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), btn.first().click({ timeout: 30_000 })]);
    return { 押せた: true, 遷移先: new URL(page.url()).pathname };
  };
  await step(1, async () => { await 名前で検索する(list, 晴大会("031"), "イベント申込を検索"); });
  await step(2, async () => { 申込側 = await デッキ表示を押す(申込IDの行(await list.行を読む(), id)[0]); });
  await step(3, async () => { await list.開く(); });
  await step(4, async () => {
    await list.イベント名.fill(晴大会("031"));
    await list.検索種別("デッキ登録を検索").check();
    await list.検索する();
  });
  await step(5, async () => {
    const row = (await list.行を読む()).find((r) => r.プレイヤー欄.split("\n")[0].trim() === 氏名);
    デッキ側 = await デッキ表示を押す(row);
  });
  await expected(async () => {
    expect.soft(申込側.押せた, "イベント申込検索の結果の「デッキ表示」ボタンを押せる").toBe(true);
    expect.soft(申込側.遷移先, "イベント申込検索の結果から遷移した画面（デッキ表示）").toMatch(/\/deck\/\d+/);
    expect.soft(デッキ側.押せた, "デッキ登録検索の結果の「デッキ表示」ボタンを押せる").toBe(true);
    expect.soft(デッキ側.遷移先, "デッキ登録検索の結果から遷移した画面（デッキ表示）").toMatch(/\/deck\/\d+/);
  });
  note("手順の検索語「晴大会」は印つきの「晴大会031」、プレイヤー名「晴屋太郎」は姓に印をつけた会員で代えた。「デッキ表示」ボタンが一覧の行にあるかを名前で探して押した（ボタンが無ければ押せずに終わり、期待結果で落ちる）");
});

// ================= 一括更新 =================

function 一括更新(n: "026" | "074", 開始時間を空にする: boolean, 両方チェック: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    await loginAdmin(page, M1306_ADMIN);
    const list = new EntryListPage(page);
    const b = new BulkEditPage(page);
    const A = notes.get(`〔申込ID-M1306-${n}A〕`), B = notes.get(`〔申込ID-M1306-${n}B〕`);
    const 前履歴: Record<string, number> = {};
    await step(1, async () => {
      await 名前で検索する(list, rc(`M1306BULK-${n}`), "イベント申込を検索", 開始時間を空にする);
      for (const id of [A, B]) 前履歴[id] = 申込の申込履歴の件数(id);
    });
    await step(2, async () => {
      await b.チェックする(A);
      if (両方チェック) await b.チェックする(B);
      await b.一括編集を開く();
    });
    await step(3, async () => {
      await b.申込状況を選ぶ("申込済み");
      const r = await b.更新を押す();
      note(`「更新」を押すと、ダイアログ「${r.文}」が出た。OK を押して閉じた`);
      await r.閉じる();
    });
    const 状況: Record<string, string> = {}; const 後履歴: Record<string, number> = {};
    await step(4, async () => { for (const id of [A, B]) { 状況[id] = 申込の申込状況(id); 後履歴[id] = 申込の申込履歴の件数(id); } });
    await expected(async () => {
      expect.soft(状況[A], `申込ID ${A} の申込状況`).toBe("申込済み");
      expect.soft(後履歴[A] - 前履歴[A], `申込ID ${A} の申込履歴の増えた件数`).toBe(1);
      if (両方チェック) {
        expect.soft(状況[B], `申込ID ${B} の申込状況`).toBe("申込済み");
        expect.soft(後履歴[B] - 前履歴[B], `申込ID ${B} の申込履歴の増えた件数`).toBe(1);
      } else {
        expect.soft(状況[B], `選択していない申込ID ${B} の申込状況（入金待ちのまま）`).toBe("入金待ち");
        expect.soft(後履歴[B] - 前履歴[B], `選択していない申込ID ${B} の申込履歴の増えた件数`).toBe(0);
      }
    });
    note(`申込状況「入金待ち」は画面で変えて作ったので、申込履歴はシード表の0件でなくケースの始めに ${Object.entries(前履歴).map(([id, c]) => `申込ID ${id}=${c}件`).join("、")}。期待は増えた件数で確かめた`);
  };
}
caseTest("IT-M13-06-026", 一括更新("026", false, true));
caseTest("IT-M13-06-074", 一括更新("074", true, false));

// ================= デッキ登録を検索した行 =================

caseTest("IT-M13-06-062", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-062〕");
  await step(1, async () => { await 名前で検索する(list, rc("M1306-062"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = 申込IDの行(await list.行を読む(), id); });
  await expected(async () => {
    expect.soft(rows.length, `申込ID ${id} のデッキ登録の行の数（申込IDの欄が「なし」でない）`).toBe(1);
    expect.soft(rows[0]?.申込欄 ?? "", "申込日時の欄").toContain(ymd(申込日時062));
    expect.soft(rows[0]?.申込欄 ?? "", "申込日時の欄の時刻").toContain(申込日時062.slice(11));
    expect.soft(rows[0]?.申込欄 ?? "", "番号の欄").toContain("PAY-M1306-062");
  });
  note("申込日時・支払番号は、DBで印つきの申込に設定した（シード表の値）。支払方法のコンビニ決済は設定していない。期待結果の「2026年8月5日9時30分」は、画面の表示「2026/08/05 09:30」で確かめた");
});

caseTest("IT-M13-06-067", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-067〕");
  await step(1, async () => { await 名前で検索する(list, rc("M1306-067"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = 申込IDの行(await list.行を読む(), id); });
  await expected(async () => {
    expect.soft(rows.length, `申込ID ${id} のデッキ登録の行の数`).toBe(1);
    const 状況 = (rows[0]?.申込欄.split("\n")[1] ?? "").trim();
    expect.soft(状況, "支払状況の欄（「-」でない）").not.toBe("-");
    expect.soft(状況, "支払状況の欄（何らかの支払状況が表示される）").not.toBe("");
  });
  note(`支払状況の欄は、「申込日時、支払状況、番号」の欄の2行目。申込日時（${申込日時067}）・支払番号は、DBで印つきの申込に設定した`);
});
