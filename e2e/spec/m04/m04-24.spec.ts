/**
 * M04-24 在庫移動指示検索・作成。正本: cases/M04-24_test_cases.tsv
 *
 * 画面の作り（pages/admin/m04_24_move_instruction.ts）のうち、手順の読み方にかかわるもの:
 * - 検索欄の出庫元店舗・入庫先店舗は必須で、入庫先店舗の初期値は「未選択」。正本の「在庫移動指示IDに…を入力して「検索する」を押す」
 *   （009・012・021・022・024）は、書かれたとおり在庫移動指示IDだけを入れて「検索」を押す。ブラウザの入力チェックが検索を止めたら、注記に残す
 *   （店舗を補って選ぶことはしない。手順の直しは依頼者が決める。記録の裁定案1の1）。
 * - 023・025 の「在庫移動指示検索画面でID …を検索する」は、検索欄のどの項目に何を入れるかを書いていない。いまは 009 群と同じく
 *   在庫移動指示IDだけを入れると読んでいるが、必須の店舗（シード表の出庫元・入庫先）も選ぶ読み方を採るかは依頼者の判断待ち（記録の裁定案1の2）。
 *   認められたら、023・025 だけ店舗も選ぶ形に変えて流し直す（期待結果は変えない）。
 * - 在庫移動を作るケース（009・012・021〜027・033・036・037）の合否は、シードが正本の外で補ったもの（承認する管理者・在庫移動用商品・入庫）が
 *   あって成り立つ。HANDOFF 4章の9 と同じ種類の判断を待っている（記録の裁定案6。seeds/m04-24.ts の冒頭）。
 * - 初めて開いたとき（検索の前）は一覧に行を出さない。正本の手順に検索が無いケース（026・027）は、行を選べない。
 * - 手順が実行できないとき、期待結果が画面の表示・遷移なら、その手順で止めて不合格にする。期待結果がDBで確かめられるもの（023・025）は、
 *   注記を残して続け、DBで確かめる。CSVの登録の送信は、送れたことを確かめてから進む（送らずに「更新されない」を合格にしない）。
 */
import { expect, Locator, Page, test } from "@playwright/test";
import fs from "node:fs";
import { 在庫移動指示, 発送状況, 紐づく在庫移動, 送り状Noの形 } from "../../db/m04_24_move_instruction";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import {
  AdminSidebar, InstructionRow, MoveInstructionDetailPage, moveInstructionDetailPath, moveInstructionListPath, MoveInstructionSearchPage,
  pathOf, SubmitResult, topMessages, trackingRegisterPath,
} from "../../pages/admin/m04_24_move_instruction";
import { M0424_ADMIN, m0424CsvPath, storeIdOf } from "../../seeds/m04-24";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** 試験管理者でログインする（事前準備①）。在庫移動指示検索画面の操作を返す */
async function signIn(page: Page): Promise<MoveInstructionSearchPage> {
  await loginAdmin(page, M0424_ADMIN);
  return new MoveInstructionSearchPage(page);
}

/** 「検索」を押した結果を注記に残し、検索が送られたかを返す */
function noteSearch(r: SubmitResult): boolean {
  note("正本の「検索する」は、検索欄の「検索」ボタンとして押した（表示の違い）");
  if (r.sent) {
    note(`検索の応答: ${r.status}`);
    return true;
  }
  note(`在庫移動指示IDだけを入れて「検索」を押すと、ブラウザの入力チェックが検索を止めた（要求は送られていない）: ${r.止めた項目.join(" / ")}`);
  return false;
}

/** 画面上部に出たメッセージを注記に残し、返す */
async function noteMessages(page: Page, when: string): Promise<{ 成功: string[]; エラー: string[] }> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
  return m;
}

/** 一覧に表示された行を注記に残し、指定の移動指示IDの行を返す */
async function rowsOf(search: MoveInstructionSearchPage, id: string): Promise<InstructionRow[]> {
  const rows = await search.listedRows();
  note(`一覧の行（上から）: ${rows.map((r) => `${r.移動指示ID}（${r.出庫元店舗}→${r.入庫先店舗}・送り状No.欄「${r.送り状No欄}」・発送状況「${r.発送状況}」）`).join(" / ") || "なし"}`);
  if (rows.length === 0) note(`一覧の案内: ${clean((await search.一覧の案内.allInnerTexts()).join(" / ")) || "なし"}`);
  return rows.filter((r) => r.移動指示ID === id);
}

/** 一覧に移動指示IDの行が無ければ、その手順は実行できないので止める（期待結果が画面の表示・遷移のケース） */
async function requireRow(search: MoveInstructionSearchPage, id: string, searched: boolean | null, what: string): Promise<void> {
  if (await search.rowById(id).count()) return;
  const why = searched === null
    ? "画面は検索の前に一覧の行を出さず、正本の手順に検索が無い"
    : searched ? "検索の結果に出ない" : "手順の検索がブラウザの入力チェックで止まり、検索されていない";
  throw new Error(`一覧に移動指示ID ${id} の行が無く、${what}（${why}）`);
}

// ---- 画面の表示 ----

caseTest("IT-M04-24-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0424_ADMIN);
  const sidebar = new AdminSidebar(page);
  const search = new MoveInstructionSearchPage(page);
  let menu: Locator | undefined;
  await step(1, async () => {
    const res = await page.goto(adminUrl("/"));
    expect(res?.ok(), `管理画面の応答（${res?.status()}）`).toBe(true);
    await expect(sidebar.group("在庫管理"), "サイドバーの「在庫管理」").toHaveCount(1);
  });
  await step(2, async () => { menu = await sidebar.openGroup("在庫管理"); });
  await step(3, async () => {
    const link = menu!.getByRole("link", { name: /^在庫移動指示/ });
    await expect(link, "在庫管理のメニューの「在庫移動指示」で始まる項目").toHaveCount(1);
    const label = clean(await link.innerText());
    if (label !== "在庫移動指示") note(`正本の「在庫移動指示」は、サイドバーの「${label}」として押した（表示の違い）`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "移った画面のアドレス").toBe(moveInstructionListPath());
    await expect.soft(search.検索欄の見出し, "「在庫移動指示検索」の見出し").toBeVisible();
    await expect.soft(search.form, "在庫移動指示検索の検索欄").toBeVisible();
  });
});

caseTest("IT-M04-24-002", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  let 出庫元 = { 表示: "", 値: "" };
  let 入庫先 = { 表示: "", 値: "" };
  let 表示件数: string | null = null;
  await step(1, async () => { await search.open(); });
  await step(2, async () => {
    出庫元 = await search.selected(search.出庫元店舗);
    入庫先 = await search.selected(search.入庫先店舗);
    表示件数 = (await search.表示件数.count()) ? (await search.selected(search.表示件数)).表示 : null;
    note(`出庫元店舗「${出庫元.表示}」（店舗ID ${出庫元.値 || "なし"}）・入庫先店舗「${入庫先.表示}」・表示件数 ${表示件数 === null ? "欄が無い（画面は検索の前に表示件数の欄を出さない）" : `「${表示件数}」`}`);
  });
  await expected(async () => {
    expect.soft(出庫元, "出庫元店舗の選択（本店）").toEqual({ 表示: "本店", 値: storeIdOf(notes, "本店") });
    expect.soft(入庫先, "入庫先店舗の選択（未選択）").toEqual({ 表示: "未選択", 値: "" });
    await expect.soft(search.表示件数, "表示件数の欄").toBeVisible();
    expect.soft(表示件数, "表示件数の選択").toBe("50件");
  });
});

// ---- 検索・一覧 ----

caseTest("IT-M04-24-009", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-009〕");
  let rows: InstructionRow[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { noteSearch(await search.searchById(id)); });
  await step(3, async () => { rows = await rowsOf(search, id); });
  await expected(async () => {
    expect(rows, `移動指示ID ${id} の行`).toHaveLength(1);
    expect.soft(rows[0].発送状況, "発送状況").toBe("未");
    expect.soft(rows[0].送り状Noの登録ボタン, "送り状No.の欄に登録ボタンがある").toBe(true);
    expect.soft(rows[0].送り状No欄, "送り状No.の欄の表示（登録ボタンだけ）").toBe("登録");
  });
});

caseTest("IT-M04-24-012", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-012〕");
  await step(1, async () => { await search.open(); });
  await step(2, async () => { noteSearch(await search.searchById(id)); });
  await expected(async () => {
    await expect.soft(search.検索結果件数, "検索結果件数").toHaveText(/^\s*検索結果：1件が該当しました\s*$/);
    await rowsOf(search, id); // 一覧の行を注記に残す
    const ids = (await search.listedRows()).map((r) => r.移動指示ID);
    expect.soft(ids, "一覧に表示された在庫移動指示").toEqual([id]);
  });
});

caseTest("IT-M04-24-021", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-021〕");
  let searched = false;
  await step(1, async () => { await search.open(); });
  await step(2, async () => { searched = noteSearch(await search.searchById(id)); });
  await step(3, async () => {
    await requireRow(search, id, searched, "移動指示IDを押せない");
    await search.pressInstructionId(id);
  });
  await expected(async () => {
    const detail = new MoveInstructionDetailPage(page);
    expect.soft(pathOf(page.url()), "移った画面のアドレス").toBe(moveInstructionDetailPath(id));
    await expect.soft(detail.見出し, "在庫移動指示詳細画面の「在庫移動指示情報」").toBeVisible();
    await expect.soft(detail.在庫移動指示ID, "在庫移動指示詳細画面の移動指示ID").toHaveText(new RegExp(`^\\s*${id}\\s*$`));
  });
});

caseTest("IT-M04-24-022", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-022〕");
  let searched = false;
  await step(1, async () => { await search.open(); });
  await step(2, async () => { searched = noteSearch(await search.searchById(id)); });
  await step(3, async () => {
    await requireRow(search, id, searched, "送り状No.欄の登録ボタンを押せない");
    await search.pressTrackingRegister(id);
  });
  await expected(async () => {
    await expect(search.送り状No登録モーダル, "送り状No.登録モーダル").toBeVisible();
    await expect.soft(search.送り状No登録モーダルの見出し, "モーダルの見出し").toHaveText(/^\s*送り状No\.登録\s*$/);
    await expect.soft(search.送り状Noの欄, "送り状No.の入力欄").toBeVisible();
    const action = await search.送り状No登録フォーム.getAttribute("action");
    expect.soft(action ? pathOf(new URL(action, page.url()).toString()) : "", `モーダルの登録の送り先（移動指示ID ${id}）`).toBe(trackingRegisterPath(id));
  });
});

caseTest("IT-M04-24-023", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-023〕");
  const moveId = notes.get("〔移動ID-M0424-023〕");
  let searched = false;
  let modal = false;
  let saved: ReturnType<typeof 在庫移動指示> = null;
  let moves: ReturnType<typeof 紐づく在庫移動> = [];
  await step(1, async () => {
    await search.open();
    note("正本の「ID …を検索する」は、在庫移動指示IDにIDを入れて「検索」を押した");
    searched = noteSearch(await search.searchById(id));
  });
  await step(2, async () => {
    if (!(await search.rowById(id).count())) {
      note(`一覧に移動指示ID ${id} の行が無く、送り状No.欄の登録ボタンを押せない（${searched ? "検索の結果に出ない" : "手順1の検索が止まった"}）。期待結果はDBで確かめるので、注記を残して続ける`);
      return;
    }
    await search.pressTrackingRegister(id);
    await expect(search.送り状No登録モーダル, "送り状No.登録モーダル").toBeVisible();
    modal = true;
  });
  await step(3, async () => {
    if (!modal) { note("送り状No.登録モーダルが開いていないので、送り状No.を入れて登録できない。注記を残して続ける"); return; }
    const r = await search.submitTracking(id, "1234-ＡＢＣ");
    note(r.sent ? `送り状No.の登録の応答: ${r.status}` : `送り状No.の登録が、ブラウザの入力チェックで止まった: ${r.止めた項目.join(" / ")}`);
    if (r.sent) await noteMessages(page, "送り状No.の登録のあと");
  });
  await step(4, async () => {
    saved = 在庫移動指示(id);
    moves = 紐づく在庫移動(id);
    note(`DB: 送り状No.「${saved?.送り状No ?? "なし"}」・紐づく在庫移動 ${moves.map((m) => `${m.在庫移動ID}=${m.ステータス}`).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がDBにある`).not.toBeNull();
    expect.soft(saved!.送り状No, "送り状No.").toBe("1234-ＡＢＣ");
    // 発送状況は表に列が無く、送り状No.の有無で決まる（db/m04_24_move_instruction.ts）
    expect.soft(発送状況(saved!), "発送状況").toBe("済");
    expect.soft(moves, "紐づく在庫移動のステータス").toEqual([{ 在庫移動ID: moveId, ステータス: "移動中" }]);
  });
});

caseTest("IT-M04-24-024", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-024〕");
  let rows: InstructionRow[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { noteSearch(await search.searchById(id)); });
  await step(3, async () => { rows = await rowsOf(search, id); });
  await expected(async () => {
    expect(rows, `移動指示ID ${id} の行`).toHaveLength(1);
    expect.soft(rows[0].送り状No欄, "送り状No.欄").toBe("TRACK-42402402");
    expect.soft(rows[0].発送状況, "発送状況").toBe("済");
  });
});

caseTest("IT-M04-24-025", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-025〕");
  let searched = false;
  let onDetail = false;
  let saved: ReturnType<typeof 在庫移動指示> = null;
  await step(1, async () => {
    await search.open();
    note("正本の「ID …を検索する」は、在庫移動指示IDにIDを入れて「検索」を押した");
    searched = noteSearch(await search.searchById(id));
  });
  await step(2, async () => {
    if (!(await search.rowById(id).count())) {
      note(`一覧に移動指示ID ${id} の行が無く、移動指示IDを押せない（${searched ? "検索の結果に出ない" : "手順1の検索が止まった"}）。期待結果はDBで確かめるので、注記を残して続ける`);
      return;
    }
    await search.pressInstructionId(id);
    onDetail = pathOf(page.url()) === moveInstructionDetailPath(id);
    if (!onDetail) note(`移動指示IDを押して移った画面が在庫移動指示詳細画面ではない（${page.url()}）`);
  });
  await step(3, async () => {
    if (!onDetail) { note("在庫移動指示詳細画面が開いていないので、送り状No.を変更できない。注記を残して続ける"); return; }
    note("正本の「保存する」は、在庫移動指示詳細画面の「登録」ボタンとして押した（表示の違い）");
    const r = await new MoveInstructionDetailPage(page).saveTrackingNo(id, "TRACK-1002-UPDATED");
    note(`保存の応答: ${r.status}`);
    await noteMessages(page, "保存のあと");
  });
  await step(4, async () => {
    saved = 在庫移動指示(id);
    note(`DB: 送り状No.「${saved?.送り状No ?? "なし"}」`);
  });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がDBにある`).not.toBeNull();
    expect.soft(saved!.送り状No, "送り状No.").toBe("TRACK-1002-UPDATED");
  });
});

// ---- 一覧の選択とダウンロード ----

caseTest("IT-M04-24-026", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-026〕");
  let state = { 数: 0, 押せる: false, ダウンロード: null as string | null };
  await step(1, async () => { await search.open(); });
  await step(2, async () => {
    await requireRow(search, id, null, "行を選択できない");
    await search.selectRow(id);
  });
  await step(3, async () => {
    const button = search.在庫移動実績入力用CSVダウンロード;
    state.数 = await button.count();
    state.押せる = state.数 > 0 && await button.isVisible() && await button.isEnabled();
    if (state.押せる) {
      // 押せるときは押して、ダウンロードされるかを見る（ダウンロードできないことの確かめ）
      const download = page.waitForEvent("download", { timeout: 15_000 }).then((d) => d.suggestedFilename(), () => null);
      await button.click();
      state.ダウンロード = await download;
    }
    note(`ダウンロード操作部の「在庫移動実績入力用CSVダウンロード」: ${state.数 ? (state.押せる ? `押せる（押した結果のダウンロード: ${state.ダウンロード ?? "なし"}）` : "押せない") : "無い"}`);
  });
  await expected(async () => {
    expect.soft(state.押せる, "「在庫移動実績入力用CSVダウンロード」が押せない（または無い）").toBe(false);
    expect.soft(state.ダウンロード, "在庫移動実績入力用CSVがダウンロードされない").toBeNull();
  });
});

caseTest("IT-M04-24-027", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-027〕");
  const stateOf = async () => {
    const button = search.送り状CSVダウンロード;
    const 数 = await button.count();
    return { 数, 押せる: 数 > 0 ? await button.isEnabled() : null };
  };
  let before: { 数: number; 押せる: boolean | null } = { 数: 0, 押せる: null };
  let after: { 数: number; 押せる: boolean | null } = { 数: 0, 押せる: null };
  await step(1, async () => { await search.open(); });
  await step(2, async () => {
    before = await stateOf();
    note(`行を選ぶ前の「送り状CSVダウンロード」: ${before.数 ? (before.押せる ? "押せる" : "押せない") : "無い（画面は検索の前にこのボタンを出さない）"}`);
  });
  await step(3, async () => {
    await requireRow(search, id, null, "行を選択できない");
    await search.selectRow(id);
    after = await stateOf();
    note(`行を選んだあとの「送り状CSVダウンロード」: ${after.数 ? (after.押せる ? "押せる" : "押せない") : "無い"}`);
  });
  await expected(async () => {
    expect.soft(before, "行を選ぶ前の送り状CSVダウンロードボタン（非活性）").toEqual({ 数: 1, 押せる: false });
    expect.soft(after, "行を選んだあとの送り状CSVダウンロードボタン（活性）").toEqual({ 数: 1, 押せる: true });
  });
});

// ---- 在庫移動実績CSV登録 ----

caseTest("IT-M04-24-029", async ({ page, step, expected }) => {
  const search = await signIn(page);
  const file = { name: "M04-24-select-029.csv", mimeType: "text/csv", buffer: Buffer.from("移動指示ID,送り状No.\n", "utf-8") };
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.openCsvRegistration(); });
  await step(3, async () => {
    note(`選ぶファイルは正本に無いので、見出しだけのCSV（${file.name}）を選んだ。登録はしない`);
    await search.chooseCsvFile(file);
  });
  await expected(async () => {
    await expect.soft(search.CSV登録モーダル, "在庫移動実績CSV登録モーダル").toBeVisible();
    const chosen = await search.ファイルの欄.evaluate((n) => Array.from((n as HTMLInputElement).files ?? []).map((f) => f.name));
    expect.soft(chosen, "モーダルのファイルの欄に選んだファイル").toEqual([file.name]);
    await expect.soft(search.選んだファイル名, "モーダルに表示されたファイル名").toHaveText(new RegExp(`^\\s*${file.name.replace(/\./g, "\\.")}\\s*$`));
    await expect.soft(search.CSVの登録ボタン, "モーダルの「登録」が押せる").toBeEnabled();
  });
});

/** CSVの登録のケース（033・036・037）の手順1〜3。ファイルの中身がシードの用意したとおりであることも確かめる */
async function uploadCsv(page: Page, search: MoveInstructionSearchPage, step: (n: number, body: () => Promise<void>) => Promise<void>,
  file: string, wantLines: string[]): Promise<void> {
  await step(1, async () => {
    await search.open();
    await search.openCsvRegistration();
  });
  await step(2, async () => {
    const lines = fs.readFileSync(file, "utf-8").split("\n").filter((l) => l !== "");
    expect(lines, "選ぶCSVの中身（1行目は「移動指示ID,送り状No.」）").toEqual(["移動指示ID,送り状No.", ...wantLines]);
    await search.chooseCsvFile(file);
  });
  await step(3, async () => {
    const r = await search.submitCsv();
    note(`CSVの登録の応答: ${r.status}（移った画面 ${pathOf(page.url())}）`);
    await noteMessages(page, "CSVの登録のあと");
  });
}

caseTest("IT-M04-24-033", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-033〕");
  let saved: ReturnType<typeof 在庫移動指示> = null;
  await uploadCsv(page, search, step, m0424CsvPath("M04-24-duplicate-033.csv"), [`${id},TRACK-A`, `${id},TRACK-B`]);
  await step(4, async () => {
    saved = 在庫移動指示(id);
    note(`DB: 送り状No.「${saved?.送り状No ?? "なし"}」`);
  });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がDBにある`).not.toBeNull();
    // シードの状態は送り状No.なし・発送状況=未。発送状況は送り状No.の有無で決まる
    expect.soft(saved!.送り状No, "送り状No.（更新されない）").toBeNull();
    expect.soft(発送状況(saved!), "発送状況（未のまま）").toBe("未");
  });
});

caseTest("IT-M04-24-036", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-036〕");
  let shape: ReturnType<typeof 送り状Noの形> = null;
  await uploadCsv(page, search, step, m0424CsvPath("M04-24-length-max-036.csv"), [`${id},${"A".repeat(65535)}`]);
  await step(4, async () => {
    shape = 送り状Noの形(id);
    note(`DB: 送り状No. ${shape ? `${shape.バイト数}バイト・${shape.文字数}文字・半角の A だけ: ${shape.半角大文字Aだけ}` : "なし"}`);
  });
  await expected(async () => {
    expect(shape, `在庫移動指示 ${id} の送り状No.が登録されている`).not.toBeNull();
    expect.soft(shape!.バイト数, "送り状No.のバイト数").toBe(65535);
    expect.soft(shape!.半角大文字Aだけ, "送り状No.は半角英字 A だけ").toBe(true);
  });
});

caseTest("IT-M04-24-037", async ({ page, notes, step, expected }) => {
  const search = await signIn(page);
  const id = notes.get("〔移動指示ID-M0424-037〕");
  let saved: ReturnType<typeof 在庫移動指示> = null;
  await uploadCsv(page, search, step, m0424CsvPath("M04-24-length-over-037.csv"), [`${id},${"A".repeat(65536)}`]);
  await step(4, async () => {
    saved = 在庫移動指示(id);
    note(`DB: 送り状No. ${saved?.送り状No ? `${saved.送り状No.length}文字` : "なし"}`);
  });
  await expected(async () => {
    expect(saved, `在庫移動指示 ${id} がDBにある`).not.toBeNull();
    expect.soft(saved!.送り状No, "送り状No.（更新されない）").toBeNull();
    expect.soft(発送状況(saved!), "発送状況（未のまま）").toBe("未");
  });
});

caseTest("IT-M04-24-043", async ({ page, step, expected }) => {
  const search = await signIn(page);
  const file = m0424CsvPath("M04-24-bad-header-043.csv");
  let messages = { 成功: [] as string[], エラー: [] as string[] };
  await step(1, async () => {
    await search.open();
    await search.openCsvRegistration();
  });
  await step(2, async () => {
    expect(fs.readFileSync(file, "utf-8"), "選ぶCSVの中身（1行目は「指示ID,伝票番号」）").toBe("指示ID,伝票番号\n");
    await search.chooseCsvFile(file);
  });
  await step(3, async () => {
    const r = await search.submitCsv();
    note(`CSVの登録の応答: ${r.status}（移った画面 ${pathOf(page.url())}）`);
    messages = await noteMessages(page, "CSVの登録のあと");
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "表示された画面のアドレス").toBe(moveInstructionListPath());
    await expect.soft(search.検索欄の見出し, "在庫移動指示検索画面").toBeVisible();
    // ヘッダー不一致のエラーは、設計書の表示メッセージ M04-24-MSG-012「CSVのヘッダーが不正です。」
    expect.soft(messages.エラー, "管理画面上部のエラー").toContain("CSVのヘッダーが不正です。");
  });
});
