/**
 * M13-06 イベント申込一覧（検索入力）。正本: cases/M13-06_test_cases.tsv
 * 実装するのは画面だけで準備できる30件。DB での準備が要るシードを使う 005・006・023・026・030・031・032・056・062・067・074 は実装しない。
 * 決め打ちの識別の値（イベント名・検索語・会員の姓）は rc() で実行ごとの印を付ける（依頼者決定 2026-10-28）。
 * 手順が「開始時間(From)を空にし」と書かないケースは、開始時間(From)を初期表示（画面を開いた日）のまま検索する。入っていた値は手順の注記に残す。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { EntryListPage, 結果の行, プレイヤーを決定する, プレイヤーを検索する } from "../../pages/admin/m13_06_entry_list";
import { M1306_ADMIN, イベント057, イベント名064, デッキだけの会員, 新規参加者, 支払方法の並び, 申込状況の並び, 読み替えた開催日 } from "../../seeds/m13-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** 画面を開いた日（実行した日） */
const 今日 = () => ymd(new Date());
/** 画面を開いた日の3か月前（月の日数が足りないときは翌月へ繰り越す。画面の作りの日付の計算と同じ） */
const 三か月前 = () => { const d = new Date(); return ymd(new Date(d.getFullYear(), d.getMonth() - 3, d.getDate())); };

async function ログインして開く(page: CaseCtx["page"]): Promise<EntryListPage> {
  await loginAdmin(page, M1306_ADMIN);
  return new EntryListPage(page);
}
async function 開始時間の注記(list: EntryListPage): Promise<void> {
  note(`開始時間(From)は初期表示の「${await list.開始時間From.inputValue()}」のまま検索した（手順に変える指示が無い）。シードの日程の開催日はシード表の 2026-09-10 前後を、実行した日以後になるよう年だけ読み替えた（${読み替えた開催日("2026-09-10 10:00").slice(0, 10)} 前後）`);
}
/** イベント名を入れ、検索種別を選んで検索する（店舗・開始時間は初期表示のまま） */
async function 名前で検索する(list: EntryListPage, 語: string, 種別: "イベント申込を検索" | "デッキ登録を検索"): Promise<void> {
  await list.開く();
  await list.イベント名.fill(語);
  await list.検索種別(種別).check();
  await 開始時間の注記(list);
  await list.検索する();
}
/** 検索結果が空かつページ番号1の初期表示であることを確かめる（初期表示ではページ送りが出ないので、出ていないか、出ていれば1であること） */
async function 初期表示であることを確かめる(list: EntryListPage): Promise<void> {
  expect.soft(await list.結果の行.count(), "検索結果の行の数").toBe(0);
  expect.soft((await list.該当件数()) ?? 0, "検索結果の件数").toBe(0);
  const p = await list.いまのページ();
  expect.soft(p ?? "1", "ページ番号（ページ送りが出ていなければ1）").toBe("1");
  expect.soft(new URL(list.page.url()).pathname, "アドレスのページ番号").not.toMatch(/\/page\/([2-9]|\d{2,})$/);
  note(`ページ番号は、ページ送りの表示（${p === null ? "出ていない" : `いまのページ ${p}`}）とアドレス（${new URL(list.page.url()).pathname}）で確かめた。初期表示の画面はページ番号を表示しない`);
}
const 申込IDの行 = (rows: 結果の行[], id: string) => rows.filter((r) => r.申込ID === id);
const プレイヤーの行 = (rows: 結果の行[], 名前: string) => rows.filter((r) => r.プレイヤー欄.split("\n")[0].trim() === 名前);

caseTest("IT-M13-06-001", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  let 検索条件欄 = ""; let バッチボタン = -1; let DCI欄 = -1;
  await step(2, async () => {
    検索条件欄 = await list.検索フォーム.innerText();
    DCI欄 = await list.検索フォーム.locator('[name*="dci" i], [id*="dci" i]').count();
    バッチボタン = await page.getByRole("button", { name: /決済中処理/ }).or(page.getByRole("link", { name: /決済中処理/ })).count();
  });
  await expected(async () => {
    expect.soft(検索条件欄, "検索条件欄の項目名にDCIナンバーが無い").not.toContain("DCI");
    expect.soft(DCI欄, "検索条件欄のDCIナンバーの入力欄の数").toBe(0);
    expect.soft(バッチボタン, "決済中処理バッチ実行ボタンの数").toBe(0);
  });
});

caseTest("IT-M13-06-002", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  let 店舗: string[] = []; let from = "";
  await step(2, async () => { 店舗 = await list.選ばれている店舗(); from = await list.開始時間From.inputValue(); });
  await expected(async () => {
    expect.soft(店舗, "店舗の初期値").toEqual(["新宿店"]);
    // 開始時間は日時の入力欄（例「2026-11-09T00:00」）。日付の部分を画面を開いた日と比べる
    note(`開始時間(From)の欄は日時の入力欄で、「${from}」が入っていた。日付の部分を画面を開いた日と比べた`);
    expect.soft(from.slice(0, 10), "開始時間(From)の日付（画面を開いた日）").toBe(今日());
    await 初期表示であることを確かめる(list);
  });
});

caseTest("IT-M13-06-004", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.モーダルを開く(); });
  await expected(async () => {
    await expect.soft(list.モーダル, "イベント情報検索の重ねて表示する一覧").toBeVisible();
    expect.soft(await list.モーダルで選ばれている店舗(), "モーダルの店舗の初期値").toBe("新宿店");
    expect.soft(await list.モーダルの開催日From.inputValue(), "モーダルの開催日(From)の初期値（画面を開いた日の3か月前）").toBe(三か月前());
  });
});

caseTest("IT-M13-06-020", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.検索種別("デッキ登録を検索").check(); });
  let 状況を開けた = true; let 支払方法を開けた = true; let 番号の値 = "";
  await step(3, async () => {
    状況を開けた = await list.選択欄を開けるか(list.申込状況);
    支払方法を開けた = await list.選択欄を開けるか(list.支払方法);
    番号の値 = await list.入力欄に打つ(list.支払番号, "PAY1306");
    note("申込状況・支払方法は選択肢の一覧を開こうとし、支払番号は「PAY1306」を打とうとした");
  });
  await expected(async () => {
    expect.soft(状況を開けた, "申込状況の選択肢の一覧が開いたか").toBe(false);
    expect.soft(支払方法を開けた, "支払方法の選択肢の一覧が開いたか").toBe(false);
    expect.soft(番号の値, "支払番号に打った文字が入ったか（空のまま）").toBe("");
    await expect.soft(list.申込状況, "申込状況の欄が無効").toBeDisabled();
    await expect.soft(list.支払方法, "支払方法の欄が無効").toBeDisabled();
    await expect.soft(list.支払番号, "支払番号の欄が無効").toBeDisabled();
  });
});

caseTest("IT-M13-06-022", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await list.選択肢の一覧を開く(list.支払方法); });
  await expected(async () => {
    expect.soft(選択肢, "支払方法の選択肢の並び（上から）").toEqual(支払方法の並び);
  });
});

caseTest("IT-M13-06-029", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const 開く出力項目設定 = async () => {
    await list.CSVダウンロードボタン.click({ timeout: 30_000 });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.出力項目設定リンク.click()]);
    return new URL(page.url()).pathname;
  };
  let 遷移先1 = ""; let 遷移先2 = "";
  await step(1, async () => { await 名前で検索する(list, rc("M1306CSVAPP-029"), "イベント申込を検索"); });
  await step(2, async () => { 遷移先1 = await 開く出力項目設定(); });
  await step(3, async () => {
    note("イベント申込検索画面へは、アドレスを開いて戻った（検索の結果の画面は送信の結果なので、ブラウザの「戻る」は使わない）");
    await list.開く();
  });
  await step(4, async () => {
    await list.イベント名.fill(rc("M1306CSVDECK-029"));
    await list.検索種別("デッキ登録を検索").check();
    await 開始時間の注記(list);
    await list.検索する();
  });
  await step(5, async () => { 遷移先2 = await 開く出力項目設定(); });
  await expected(async () => {
    expect.soft(遷移先1, "イベント申込検索の結果からの遷移先（CSV出力項目設定画面）").toMatch(/\/setting\/shop\/csv\/\d+$/);
    expect.soft(遷移先2, "デッキ登録検索の結果からの遷移先（CSV出力項目設定画面）").toMatch(/\/setting\/shop\/csv\/\d+$/);
  });
});

caseTest("IT-M13-06-036", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const 語 = rc("M1306PAGE-036");
  await step(1, async () => { await 名前で検索する(list, 語, "イベント申込を検索"); });
  await step(2, async () => {
    await list.表示件数を選ぶ(10);
    await list.ページを開く(2);
    expect(await list.いまのページ(), "2ページ目を開いた").toBe("2");
  });
  await step(3, async () => { await list.サイドメニューから開く(); });
  await expected(async () => {
    expect.soft(await list.イベント名.inputValue(), "検索条件のイベント名（保持されていた値が引き継がれない）").not.toContain(語);
    await 初期表示であることを確かめる(list);
  });
});

caseTest("IT-M13-06-038", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.アドレスで開く("/event/entry/page/2"); });
  await expected(async () => {
    expect.soft(await list.表示された申込ID(), "表示された申込").toEqual([]);
    await 初期表示であることを確かめる(list);
  });
});

caseTest("IT-M13-06-039", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await 名前で検索する(list, rc("M1306PAGE-039"), "イベント申込を検索"); });
  const link = list.並べ替えのリンク.first();
  await step(2, async () => {
    if ((await link.count()) === 0) throw new Error("並び順のメニューが無い（検索結果が出ていない）");
    const before = (await link.getAttribute("href")) ?? "";
    const after = before.replace(/([?&]order=)[^&]*/, "$1invalid-order");
    await link.evaluate((a, h) => (a as HTMLAnchorElement).setAttribute("href", h), after);
    note(`開発者ツールで行うのと同じに、並べ替えのリンクの送信値を「${before}」から「${after}」に書き換えた`);
  });
  await step(3, async () => {
    // 並び順のメニューは入れ子で開くので、書き換えたリンクをその場で押す
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.evaluate((a) => (a as HTMLAnchorElement).click())]);
    await list.読み込みを待つ();
  });
  await expected(async () => {
    await expect.soft(page.locator(".alert-danger"), "並び順の不正を示すエラー").toContainText("並べかえ条件に不正な値が設定されています");
    await 初期表示であることを確かめる(list);
  });
});

caseTest("IT-M13-06-044", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const d = notes.get("〔日程ID-M1306-044〕");
  await step(1, async () => { await list.アドレスで開く(`/event/entry/event_detail/${d}`); });
  await expected(async () => {
    note(`開始時間(From)には「${await list.開始時間From.inputValue()}」が入っていた`);
    expect.soft(await list.イベント詳細ID.inputValue(), "検索条件のイベント詳細ID").toBe(d);
    await expect.soft(list.検索種別("イベント申込を検索"), "検索種別がイベント申込を検索").toBeChecked();
    expect.soft(await list.表示された申込ID(), "表示された申込ID").toEqual([notes.get("〔申込ID-M1306-044〕")]);
  });
});

caseTest("IT-M13-06-046", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const d = notes.get("〔日程ID-M1306-046〕");
  await step(1, async () => {
    await page.goto(adminUrl(`/entry_registration/new/${d}`));
    await page.waitForLoadState("load");
    await expect(page.locator("#submit_entry"), "イベント新規申込登録画面の登録ボタン").toBeAttached();
  });
  await step(2, async () => {
    const 行 = await プレイヤーを検索する(page, `${新規参加者.姓} ${新規参加者.名}`);
    await プレイヤーを決定する(page, 行, notes.get("〔プレイヤーID-M1306-046〕"));
  });
  await step(3, async () => {
    await expect(page.locator("#submit_entry"), "登録ボタンを押せる").toBeEnabled();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#submit_entry").click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "登録後の遷移先（イベント申込検索画面）").toMatch(/\/event\/entry(\/page\/\d+)?\/?$/);
    await expect.soft(list.検索フォーム, "イベント申込検索画面の検索条件").toBeVisible();
  });
});

caseTest("IT-M13-06-048", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await list.選択肢の一覧を開く(list.店舗); });
  await expected(async () => {
    expect.soft(選択肢, "店舗の選択肢に編集権限のある新宿店").toContain("新宿店");
    expect.soft(選択肢, "店舗の選択肢に編集権限のない池袋店").toContain("池袋店");
    expect.soft(選択肢.length, "店舗の選択肢の数").toBe(2);
  });
});

caseTest("IT-M13-06-049", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.モーダルを開く(); });
  let 選択肢: string[] = [];
  await step(3, async () => {
    await list.モーダルの店舗.click();
    選択肢 = await list.モーダルの店舗の選択肢();
    note(`モーダルの店舗の選択肢（「指定なし」を除く）: ${選択肢.join("、")}`);
  });
  await expected(async () => {
    expect.soft(選択肢, "モーダルの店舗の選択肢に編集権限のある新宿店").toContain("新宿店");
    expect.soft(選択肢, "モーダルの店舗の選択肢に編集権限のない池袋店").toContain("池袋店");
    expect.soft(選択肢.length, "モーダルの店舗の選択肢の数").toBe(2);
  });
});

caseTest("IT-M13-06-050", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.検索種別("イベント申込を検索").check(); });
  let 選択肢: string[] = [];
  await step(3, async () => { 選択肢 = await list.選択肢の一覧を開く(list.申込状況); });
  await expected(async () => {
    expect.soft([...選択肢].sort(), "申込状況の選択肢（6種）").toEqual([...申込状況の並び].sort());
    expect.soft(選択肢.length, "申込状況の選択肢の数").toBe(6);
  });
});

/** 051〜054: 申込状況で絞り込み、A だけが出ること */
function 申込状況で絞る(n: string, 状況: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const list = await ログインして開く(page);
    await step(1, async () => {
      await list.開く();
      await list.検索種別("イベント申込を検索").check();
      await list.イベント名.fill(rc(`M1306-${n}`));
      await list.店舗を選ぶ(["新宿店"]);
      await list.申込状況を選ぶ([状況]);
      await 開始時間の注記(list);
      await list.検索する();
    });
    await expected(async () => {
      const ids = await list.表示された申込ID();
      expect.soft(ids, `申込状況「${状況}」の申込だけが表示される`).toEqual([notes.get(`〔申込ID-M1306-${n}A〕`)]);
      expect.soft(ids, "申込済みの申込は表示されない").not.toContain(notes.get(`〔申込ID-M1306-${n}B〕`));
    });
  };
}
caseTest("IT-M13-06-051", 申込状況で絞る("051", "決済中"));
caseTest("IT-M13-06-052", 申込状況で絞る("052", "入金期限切れ"));
caseTest("IT-M13-06-053", 申込状況で絞る("053", "キャンセル済み"));
caseTest("IT-M13-06-054", 申込状況で絞る("054", "支払番号が存在しない"));

caseTest("IT-M13-06-055", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); await list.検索種別("イベント申込を検索").check(); });
  await step(2, async () => {
    await list.イベント名.fill(rc("M1306-055"));
    await list.店舗を選ぶ(["新宿店"]);
    await list.デッキ登録有無("デッキ未登録").check();
    await 開始時間の注記(list);
  });
  await step(3, async () => { await list.検索する(); });
  await expected(async () => {
    const ids = await list.表示された申込ID();
    expect.soft(ids, "デッキ未登録の申込だけが表示される").toEqual([notes.get("〔申込ID-M1306-055B〕")]);
    expect.soft(ids, "デッキ登録済みの申込は表示されない").not.toContain(notes.get("〔申込ID-M1306-055A〕"));
  });
});

caseTest("IT-M13-06-057", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const e = notes.get("〔イベントID-M1306-057〕");
  await step(1, async () => { await list.開く(); await list.モーダルを開く(); });
  await step(2, async () => {
    await list.モーダルのイベント名.fill(rc("M1306-057"));
    await list.モーダルの店舗.selectOption({ label: "新宿店" });
    await list.日付を入れる(list.モーダルの開催日From, "2026/09/01");
    await list.日付を入れる(list.モーダルの開催日To, "2026/09/30");
    await list.モーダルで検索する();
  });
  let 行の数 = 0; let イベント名の欄 = "";
  await step(3, async () => {
    const row = list.モーダルのイベント行(e);
    行の数 = await row.count();
    if (行の数 > 0) イベント名の欄 = (await row.first().locator("td").nth(1).innerText()).replace(/\s+/g, " ").trim();
  });
  await expected(async () => {
    expect.soft(行の数, `イベントID ${e} の行の数`).toBe(1);
    expect.soft(イベント名の欄, "イベント名の欄にイベント名（日）").toContain(イベント057.名日);
    expect.soft(イベント名の欄, "イベント名の欄にイベント名（英）").toContain(イベント057.名英);
    expect.soft(イベント名の欄, "イベント名の欄に開催店舗").toContain("新宿店");
    expect.soft(イベント名の欄, "イベント名の欄にフォーマット").toContain(イベント057.フォーマット);
  });
});

caseTest("IT-M13-06-059", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-059〕");
  await step(1, async () => { await 名前で検索する(list, rc("M1306-059"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = 申込IDの行(await list.行を読む(), id); });
  await expected(async () => {
    expect.soft(rows.length, `申込ID ${id} のデッキ登録の行の数`).toBe(1);
    expect.soft(rows[0]?.チェックあり, "その行のチェックボックスの表示").toBe(true);
  });
});

caseTest("IT-M13-06-060", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const m = デッキだけの会員["060"]; const 名前 = `${m.姓} ${m.名}`;
  await step(1, async () => { await 名前で検索する(list, rc("M1306-060"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = プレイヤーの行(await list.行を読む(), 名前); });
  await expected(async () => {
    expect.soft(rows.length, `プレイヤー名「${名前}」のデッキ登録の行の数`).toBe(1);
    expect.soft(rows[0]?.チェックあり, "その行のチェックボックスの表示").toBe(false);
  });
});

caseTest("IT-M13-06-061", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-061〕");
  await step(1, async () => { await 名前で検索する(list, rc("M1306-061"), "デッキ登録を検索"); });
  await step(2, async () => {
    const rows = 申込IDの行(await list.行を読む(), id);
    if (rows.length !== 1) throw new Error(`申込ID ${id} のデッキ登録の行が ${rows.length} 行ある（1行のはず）`);
    await rows[0].行.locator("input.playerCheck").check();
  });
  await step(3, async () => { await list.一括編集リンク.click(); });
  await expected(async () => {
    await expect.soft(list.一括編集のモーダル, "イベント申込一括編集のモーダル").toBeVisible();
  });
});

caseTest("IT-M13-06-063", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const m = デッキだけの会員["063"]; const 名前 = `${m.姓} ${m.名}`;
  await step(1, async () => { await 名前で検索する(list, rc("M1306-063"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = プレイヤーの行(await list.行を読む(), 名前); });
  await expected(async () => {
    expect.soft(rows.length, `プレイヤー名「${名前}」のデッキ登録の行の数`).toBe(1);
    expect.soft(rows[0]?.申込ID, "申込IDの欄").toBe("なし");
    // 画面は申込日時・支払状況・番号を1つの欄にまとめて表示する。その欄の文字が「-」であることを確かめる
    note("申込日時・支払状況・番号は画面では1つの欄（見出し「申込日時、支払状況、番号」）にまとめて表示される。その欄の文字を確かめた");
    expect.soft(rows[0]?.申込欄, "申込日時・支払状況・番号の欄").toBe("-");
  });
});

caseTest("IT-M13-06-064", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  const m = デッキだけの会員["064"]; const 名前 = `${m.姓} ${m.名}`;
  await step(1, async () => { await 名前で検索する(list, rc("M1306-064"), "デッキ登録を検索"); });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = プレイヤーの行(await list.行を読む(), 名前); });
  await expected(async () => {
    expect.soft(rows.length, `プレイヤー名「${名前}」のデッキ登録の行の数`).toBe(1);
    expect.soft(rows[0]?.プレイヤー欄 ?? "", "プレイヤー名の表示").toContain(名前);
    expect.soft(rows[0]?.プレイヤー欄のリンク数, "プレイヤー名・デッキ登録状況の欄のリンクの数（リンクではないラベル）").toBe(0);
    expect.soft(rows[0]?.イベント欄 ?? "", "イベント名").toContain(イベント名064);
    expect.soft(rows[0]?.イベント欄 ?? "", "店舗").toContain("新宿店");
    // 開催日はシードで読み替えた日（シード表の 2026-09-10 の年だけを実行した日以後へずらした日）
    const 開催日 = 読み替えた開催日("2026-09-10 10:00").slice(0, 10).replace(/-/g, "/");
    if (開催日 !== "2026/09/10") note(`期待結果の開催日「2026年9月10日」は、シードで読み替えた開催日「${開催日}」として確かめた`);
    expect.soft(rows[0]?.イベント欄 ?? "", "開催日").toContain(開催日);
  });
});

caseTest("IT-M13-06-065", async ({ page, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.検索種別("イベント申込を検索").check(); });
  let 検索条件欄 = "";
  await step(3, async () => { 検索条件欄 = await list.検索フォーム.innerText(); });
  await expected(async () => {
    expect.soft(検索条件欄, "検索条件の項目名").not.toContain("チームメンバー確認状況");
  });
});

caseTest("IT-M13-06-068", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  const id = notes.get("〔申込ID-M1306-068〕");
  await step(1, async () => {
    await list.開く();
    await list.開始時間From.fill("");
    await list.イベント名.fill(rc("M1306-068"));
    await list.店舗を選ぶ(["池袋店"]);
    await list.検索種別("デッキ登録を検索").check();
    await list.検索する();
  });
  let rows: 結果の行[] = [];
  await step(2, async () => { rows = 申込IDの行(await list.行を読む(), id); });
  await expected(async () => {
    expect.soft(rows.length, `申込ID ${id} のデッキ登録の行の数`).toBe(1);
    expect.soft(rows[0]?.チェックあり, "その行のチェックボックスの表示").toBe(false);
  });
});

/** 069・070: 開始時間(From)を空にし、申込状況で絞り込み、A だけが出ること */
function 開始時間を空にして申込状況で絞る(n: string, 状況: string, ほか: string[]) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const list = await ログインして開く(page);
    await step(1, async () => { await list.開く(); await list.検索種別("イベント申込を検索").check(); });
    await step(2, async () => {
      await list.開始時間From.fill("");
      await list.イベント名.fill(rc(`M1306-${n}`));
      await list.店舗を選ぶ(["新宿店"]);
      await list.申込状況を選ぶ([状況]);
    });
    await step(3, async () => { await list.検索する(); });
    await expected(async () => {
      const ids = await list.表示された申込ID();
      expect.soft(ids, `申込状況が「${状況}」の申込だけが表示される`).toEqual([notes.get(`〔申込ID-M1306-${n}A〕`)]);
      for (const [x, s] of ほか.map((s, i) => [["B", "C"][i], s])) {
        expect.soft(ids, `${s}の申込は表示されない`).not.toContain(notes.get(`〔申込ID-M1306-${n}${x}〕`));
      }
    });
  };
}
caseTest("IT-M13-06-069", 開始時間を空にして申込状況で絞る("069", "入金待ち", ["申込済み", "キャンセル済み"]));
caseTest("IT-M13-06-070", 開始時間を空にして申込状況で絞る("070", "申込済み", ["入金待ち", "決済中"]));

caseTest("IT-M13-06-071", async ({ page, notes, step, expected }) => {
  const list = await ログインして開く(page);
  await step(1, async () => { await list.開く(); await list.検索種別("イベント申込を検索").check(); });
  await step(2, async () => {
    await list.開始時間From.fill("");
    await list.イベント名.fill(rc("M1306-071"));
    await list.店舗を選ぶ(["新宿店"]);
    await list.デッキ登録有無("登録デッキあり").check();
  });
  await step(3, async () => { await list.検索する(); });
  await expected(async () => {
    const ids = await list.表示された申込ID();
    expect.soft(ids, "デッキ登録済みの申込だけが表示される").toEqual([notes.get("〔申込ID-M1306-071A〕")]);
    expect.soft(ids, "デッキ未登録の申込は表示されない").not.toContain(notes.get("〔申込ID-M1306-071B〕"));
  });
});
