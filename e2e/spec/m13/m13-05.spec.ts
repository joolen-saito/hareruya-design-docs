/**
 * M13-05 複製新規。正本: integration_test/casegen/cases/M13-05_test_cases.tsv（手順・期待結果の文は正本から引く）
 *
 * - 「複製新規画面」は、イベント編集画面の「複製新規」が開く画面（アドレス /event/{複製元ID}/copy。見出しは「イベント登録」）。
 *   この画面の「登録」は、イベント登録と同じ送信先（/event/create）へ送る作り。入力エラーで再表示された画面のアドレスは /event/create になる。
 * - 実装しないケース: 008（コンビニ決済の複製元をDBで作る）・010・034（申込・デッキ登録・チームプレイヤーをDBで作る）・011（イベントID 999999 をDBで消す）・
 *   012（会場A・会場BをDBで作り、その選択肢だけを見る）。理由は seeds/m13-05.ts の先頭。
 * - 会場・備考は、イベント登録の画面に入力項目が無い（設計書には会場 1-4・備考 2-3/2-4 がある）。期待結果がこれらを含むケースは、入力項目があることも確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { EventForm, openEventCreate, openEventEdit } from "../../pages/admin/event";
import {
  openEventCopy, pressCopy, 小見出し, 店舗のエラー, 成功メッセージ, フォーマットのタグ, フォーマットの選択を外す, 見出しのある入力行の数, チーム戦以外のチーム項目の数,
  備考の入力欄, 会場を選ぶ, 備考を入れる, フォームの値, フォームの値を読む, 編集画面のイベントID,
} from "../../pages/admin/m13_05_copy";
import { EventListPage } from "../../pages/admin/m13_01_event_list";
import { registerSchedule } from "../../pages/admin/schedule";
import { EventSearchPage } from "../../pages/front/f07_02_event_search";
import { 検索結果のカード, 結果なしの文 } from "../../pages/front/m13_13_event_cards";
import { カードから大会詳細を開く, 大会詳細, 大会詳細を読む } from "../../pages/front/m13_05_event_detail";
import { イベント名で探す, 保存されているイベント, 保存イベント } from "../../db/event";
import { QK1302_ADMIN, QK連携店舗 } from "../../seeds/m13-02-qk";
import { M1305_ADMIN, 名, 複製元の名前, あ255, バナー, 賞品, 備考, フリー入力エリアの値 } from "../../seeds/m13-05";
import { 印店名 } from "../../pages/admin/m13_marked_shop";

const note = (m: string | null) => { if (m) test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (url: string) => new URL(url).pathname;

/** DB確認の値から、イベントID・登録者・更新日時を除いた入力項目だけにする */
function 入力項目(e: 保存イベント): Omit<保存イベント, "イベントID" | "登録者の管理者ID" | "更新日時"> {
  const { イベントID: _i, 登録者の管理者ID: _m, 更新日時: _u, ...rest } = e;
  return rest;
}

/** 登録を押す。ブラウザの入力チェックが送信を止めたら注記に残す。送信されたかを返す */
async function 登録を押す(form: EventForm): Promise<boolean> {
  const sent = await form.submit(form.登録ボタン);
  if (!sent) note("登録ボタンを押したが、ブラウザの入力チェックが送信を止めた（画面は変わらない）");
  return sent;
}

caseTest("IT-M13-05-001", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1305-001〕");
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.複製新規ボタン.click(); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect(path(page.url()), "遷移した画面のアドレス（複製元のイベントIDの複製新規）").toMatch(new RegExp(`/event/${id}/copy$`));
    await expect.soft(小見出し(page), "画面の小見出し（新規の登録の画面）").toHaveText("イベント登録");
    await expect.soft(form.イベント名日, "イベント名(日)に複製元の値が入っている").toHaveValue(複製元の名前("001"));
  });
});

caseTest("IT-M13-05-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1305-002〕")); });
  await step(2, async () => { await expect(form.操作部, "画面下部の操作部").toBeVisible(); });
  await expected(async () => {
    await expect.soft(form.イベント名日, "店舗Cのイベントの編集画面が開いている").toHaveValue(名.権限外店舗);
    await expect(form.複製新規ボタン, "「複製新規」ボタンが表示されない").toHaveCount(0);
  });
});

caseTest("IT-M13-05-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let 選択肢: string[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-003〕")); });
  await step(2, async () => { await form.店舗.click(); 選択肢 = await form.options(form.店舗); await page.keyboard.press("Escape"); });
  note("店舗A・店舗B・店舗Cは印つきの店舗（" + 印店名.A + "・" + 印店名.B + "・" + 印店名.C + "）を作って使った");
  await expected(async () => {
    expect.soft(選択肢, "店舗の選択肢に店舗Aがある").toContain(印店名.A);
    expect.soft(選択肢, "店舗の選択肢に店舗Bがある").toContain(印店名.B);
    expect.soft(選択肢, "店舗の選択肢に店舗Cが無い").not.toContain(印店名.C);
  });
});

/** 004・005: 複製新規で、開発者ツールで店舗Cを足して選び、登録する */
function 権限外の店舗で登録(n: "004" | "005", イベント名: string, DB確認: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1305_ADMIN);
    let form!: EventForm;
    let sent = false;
    let found: 保存イベント[] = [];
    await step(1, async () => { form = await openEventCopy(page, notes.get(`〔イベントID-M1305-${n}〕`)); });
    await step(2, async () => { await form.イベント名日.fill(イベント名); });
    await step(3, async () => { await form.forceOption(form.店舗, notes.get("〔店舗ID-M1305-共有C〕")); });
    await step(4, async () => { sent = await 登録を押す(form); });
    if (DB確認) await step(5, async () => { found = イベント名で探す(イベント名); });
    await expected(async () => {
      if (DB確認) {
        expect(found.map((e) => `イベントID ${e.イベントID}（${e.店舗}）`), "入力したイベント名のイベントが登録されていない").toEqual([]);
        return;
      }
      expect.soft(sent, "登録の送信が行われた").toBe(true);
      note(`送信後の画面のアドレス: ${path(page.url())}（複製新規の画面の登録は、イベント登録と同じ送信先へ送る作り）`);
      expect.soft(編集画面のイベントID(page), "登録されてイベント編集画面へ移っていない").toBe("");
      await expect.soft(小見出し(page), "再表示された画面の小見出し（新規の登録の画面）").toHaveText("イベント登録");
      await expect.soft(form.イベント名日, "イベント名(日)の入力値が保持されている").toHaveValue(イベント名);
      await expect.soft(店舗のエラー(page).first(), "店舗の欄にエラーが表示されている").toBeVisible();
    });
  };
}
caseTest("IT-M13-05-004", 権限外の店舗で登録("004", 名.権限エラー, false));
caseTest("IT-M13-05-005", 権限外の店舗で登録("005", 名.権限外登録, true));

caseTest("IT-M13-05-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let 値!: フォームの値;
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-007〕")); });
  await step(2, async () => { 値 = await フォームの値を読む(form); });
  await expected(async () => {
    expect.soft(値["イベント名(日)"], "イベント名(日)").toBe(複製元の名前("007"));
    expect.soft(値["イベント名(英)"], "イベント名(英)").toBe("Source Event-M1305-007");
    expect.soft((await form.会場.count()) ? await form.selected(form.会場) : ["（会場の入力項目が無い）"], "会場（入力項目があり、会場Aが選ばれている）").toEqual(["会場A"]);
    expect.soft(値.フォーマット, "フォーマット").toEqual(["形式A", "形式B"]);
    expect.soft(値.ルール適用度, "ルール適用度").toBe("初心者歓迎");
    expect.soft(値.公開状態, "公開状態").toBe("限定公開");
    expect.soft(値.イベント規模, "イベント規模").toBe("大型イベント");
    expect.soft(値["バナーURL(日)"], "バナーURL(日)").toBe(バナー.バナーURL日);
    expect.soft(値["バナーURL(英)"], "バナーURL(英)").toBe(バナー.バナーURL英);
    expect.soft(値.定員, "定員").toBe("32");
    expect.soft(値.チーム戦, "チーム戦（真＝オン）").toBe("真");
    expect.soft(値.参加費, "参加費").toBe("1000");
    expect.soft(値["賞品(日)"], "賞品(日)").toBe(賞品.賞品日);
    expect.soft(値["賞品(英)"], "賞品(英)").toBe(賞品.賞品英);
    await expect.soft(備考の入力欄(page, "日").first(), "備考(日)の入力項目があり、複製元の値が入っている").toHaveValue(備考[0], { timeout: 2000 });
    await expect.soft(備考の入力欄(page, "英").first(), "備考(英)の入力項目があり、複製元の値が入っている").toHaveValue(備考[1], { timeout: 2000 });
    const want = フリー入力エリアの値("007");
    expect.soft(値.フリー入力エリア, "フリー入力エリア1〜3の項目名・内容・アコーディオン表示（真＝オン）").toEqual(want.map((a) => ({
      "項目名(日)": a.項目名日, "項目名(英)": a.項目名英, "内容(日)": a.内容日, "内容(英)": a.内容英, 初期表示は閉じる: a.初期表示は閉じる ? "真" : "偽",
    })));
  });
});

caseTest("IT-M13-05-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let 見出し: Record<string, number> = {};
  let 項目 = -1;
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-009〕")); });
  await step(2, async () => {
    for (const h of ["チーム人数", "メールアドレス", "席次"]) 見出し[h] = await 見出しのある入力行の数(page, h);
    項目 = await チーム戦以外のチーム項目の数(page);
  });
  await expected(async () => {
    await expect.soft(form.チーム戦, "チーム戦のチェックボックスが表示されている").toBeVisible();
    expect.soft(見出し["チーム人数"], "チーム人数の入力欄の数").toBe(0);
    expect.soft(見出し["メールアドレス"], "チームメンバーのメールアドレスの入力欄の数").toBe(0);
    expect.soft(見出し["席次"], "席次の入力欄の数").toBe(0);
    expect.soft(項目, "チーム戦のチェック以外の、チームに関する入力項目の数").toBe(0);
  });
});

caseTest("IT-M13-05-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-013〕")); });
  await step(2, async () => {
    const n = await フォーマットの選択を外す(page);
    note(`フォーマットのタグの「×」を ${n} 回押して、既存の選択（形式A・形式B）を外した`);
    expect(await form.selected(form.フォーマット), "既存の選択を外したあとのフォーマットの選択").toEqual([]);
  });
  await step(3, async () => {
    await form.フォーマットの入力欄.click();
    await form.フォーマットの入力欄.pressSequentially("形式A");
    await expect(form.フォーマットの候補.first(), "フォーマットの候補").toBeVisible();
  });
  await step(4, async () => { await form.フォーマットの候補.filter({ hasText: /^形式A$/ }).first().click(); });
  await expected(async () => {
    expect(await フォーマットのタグ(page), "フォーマットの欄のタグ").toContain("形式A");
  });
});

/** 014・015: チーム戦のチェックを変えて、定員の接尾辞を見る */
function 定員の接尾辞(n: "014" | "015", チーム戦: boolean, 接尾辞: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1305_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventCopy(page, notes.get(`〔イベントID-M1305-${n}〕`)); });
    await step(2, async () => { await form.チーム戦.setChecked(チーム戦); });
    await step(3, async () => { await expect(form.定員の接尾辞).toBeVisible(); });
    await expected(async () => {
      await expect(form.定員の接尾辞, "定員の接尾辞").toHaveText(接尾辞);
    });
  };
}
caseTest("IT-M13-05-014", 定員の接尾辞("014", false, "人"));
caseTest("IT-M13-05-015", 定員の接尾辞("015", true, "組"));

caseTest("IT-M13-05-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1305-017〕");
  const 名前 = 複製元の名前("017");
  await loginAdmin(page, M1305_ADMIN);
  const list = new EventListPage(page);
  let form!: EventForm;
  await step(1, async () => {
    await list.開く();
    // 開催日の検索条件は初期表示で「3か月前から」が入っていて、日程の無いイベントが出ない。空にして検索する
    await list.開催日From.fill("");
    await list.開催日To.fill("");
    note("開催日の検索条件（初期表示は3か月前から）を空にして、イベント名で検索した（複製元のイベントには日程が無い）");
    await list.名前略称で検索する(名前);
    expect(await list.結果のID(), "検索結果にイベントが出た").toContain(id);
  });
  await step(2, async () => {
    await list.編集ボタンを押す(id);
    await list.メニュー項目(id, "編集").click();
    await page.waitForURL(new RegExp(`/event/${id}/edit$`), { waitUntil: "load" });
    form = new EventForm(page);
  });
  await step(3, async () => { await pressCopy(form, id); });
  await step(4, async () => { await form.イベント一覧リンク.click(); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(path(page.url()), "戻った画面のアドレス（イベント一覧）").toMatch(/\/event(\/page\/\d+)?$/);
    await expect.soft(list.名前略称, "イベント名の検索条件が保持されている").toHaveValue(名前);
    expect.soft(await list.結果のID(), "検索結果の行（複製元のイベントだけ）").toEqual([id]);
  });
});

caseTest("IT-M13-05-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let 入力値!: フォームの値;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-018〕")); });
  await step(2, async () => { await form.イベント名日.fill(名.複製登録); });
  await step(3, async () => { 入力値 = await フォームの値を読む(form); await 登録を押す(form); });
  await step(4, async () => { found = イベント名で探す(名.複製登録); });
  await expected(async () => {
    expect(found.length, "イベント名(日)が「複製登録イベント」のイベントの件数").toBe(1);
    expect.soft(found[0] && 入力項目(found[0]), "登録されたイベントの値（登録を押す前にフォームに入っていた値）").toEqual(入力値);
  });
});

const 空のエリア = { 項目名日: "", 項目名英: "", 内容日: "", 内容英: "", 初期表示は閉じる: false };

caseTest("IT-M13-05-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-019〕")); });
  await step(2, async () => { await form.イベント名日.fill(名.任意項目空); });
  await step(3, async () => {
    note(await form.clear(form.イベント規模, "イベント規模"));
    await form.fill({
      バナーURL日: "", バナーURL英: "", チーム戦: false, 支払方法: [], 賞品日: "", 賞品英: "",
      フリー入力エリア: [空のエリア, 空のエリア, 空のエリア],
    });
    if (!(await 備考を入れる(page, "", ""))) note("備考(日)・備考(英)の入力項目が画面に無いので、空にする操作はできなかった");
  });
  await step(4, async () => { await 登録を押す(form); });
  await step(5, async () => { found = イベント名で探す(名.任意項目空); });
  await expected(async () => {
    expect(found.length, "イベント名(日)が「任意項目空イベント」のイベントの件数").toBe(1);
    const e = found[0];
    expect.soft(e && {
      イベント規模: e.イベント規模, "バナーURL(日)": e["バナーURL(日)"], "バナーURL(英)": e["バナーURL(英)"], チーム戦: e.チーム戦, 支払方法: e.支払方法,
      "賞品(日)": e["賞品(日)"], "賞品(英)": e["賞品(英)"], フリー入力エリア: e.フリー入力エリア,
    }, "任意項目が空または未選択（チーム戦・アコーディオン表示は偽＝オフ）").toEqual({
      イベント規模: "", "バナーURL(日)": "", "バナーURL(英)": "", チーム戦: "偽", 支払方法: [], "賞品(日)": "", "賞品(英)": "",
      フリー入力エリア: [1, 2, 3].map(() => ({ "項目名(日)": "", "項目名(英)": "", "内容(日)": "", "内容(英)": "", 初期表示は閉じる: "偽" })),
    });
    expect.soft(await 備考の入力欄(page, "日").count(), "備考(日)の入力項目がある（空にして登録できる）").toBeGreaterThan(0);
  });
});

caseTest("IT-M13-05-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let sent = false;
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-021〕")); });
  await step(2, async () => { await form.イベント名日.fill(名.入力保持); await form.イベント名英.fill(""); });
  await step(3, async () => { sent = await 登録を押す(form); });
  await expected(async () => {
    expect.soft(sent, "登録の送信が行われ、画面が再表示された").toBe(true);
    expect.soft(編集画面のイベントID(page), "登録されてイベント編集画面へ移っていない").toBe("");
    await expect.soft(小見出し(page), "再表示された画面の小見出し（新規の登録の画面）").toHaveText("イベント登録");
    await expect.soft(form.イベント名日, "イベント名(日)の値").toHaveValue(名.入力保持);
    await expect.soft(form.イベント名英, "イベント名(英)の値（空）").toHaveValue("");
  });
});

caseTest("IT-M13-05-022", async ({ page, notes, step, expected }) => {
  const A255 = "A".repeat(255);
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-022〕")); });
  await step(2, async () => {
    await form.fill({ イベント名日: あ255, バナーURL日: あ255, フリー入力エリア: [{ 項目名日: あ255 }, { 項目名日: あ255 }, { 項目名日: あ255 }] });
  });
  await step(3, async () => {
    await form.fill({ イベント名英: A255, バナーURL英: A255, フリー入力エリア: [{ 項目名英: A255 }, { 項目名英: A255 }, { 項目名英: A255 }] });
  });
  await step(4, async () => { await 登録を押す(form); });
  await step(5, async () => { found = イベント名で探す(あ255); });
  await expected(async () => {
    expect(found.length, "イベント名(日)が「あ」255文字のイベントの件数").toBe(1);
    const e = found[0];
    expect.soft(e && [e["イベント名(日)"], e["バナーURL(日)"], ...e.フリー入力エリア.map((a) => a["項目名(日)"])], "日本語の5項目（イベント名・バナーURL・フリー入力エリア1〜3の項目名）").toEqual(Array(5).fill(あ255));
    expect.soft(e && [e["イベント名(英)"], e["バナーURL(英)"], ...e.フリー入力エリア.map((a) => a["項目名(英)"])], "英語の5項目（イベント名・バナーURL・フリー入力エリア1〜3の項目名）").toEqual(Array(5).fill(A255));
  });
});

caseTest("IT-M13-05-024", async ({ page, notes, step, expected }) => {
  const 元 = notes.get("〔イベントID-M1305-024〕");
  const あ = "あ".repeat(4096), A = "A".repeat(4096);
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let 備考を入れた = false;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, 元); });
  await step(2, async () => {
    await form.fill({ 賞品日: あ, フリー入力エリア: [{ 内容日: あ }, { 内容日: あ }, { 内容日: あ }] });
    備考を入れた = (await 備考の入力欄(page, "日").count()) > 0;
    if (備考を入れた) await 備考の入力欄(page, "日").first().fill(あ); else note("備考(日)の入力項目が画面に無いので、備考(日)には入力できなかった");
  });
  await step(3, async () => {
    await form.fill({ 賞品英: A, フリー入力エリア: [{ 内容英: A }, { 内容英: A }, { 内容英: A }] });
    if ((await 備考の入力欄(page, "英").count()) > 0) await 備考の入力欄(page, "英").first().fill(A); else { 備考を入れた = false; note("備考(英)の入力項目が画面に無いので、備考(英)には入力できなかった"); }
  });
  await step(4, async () => { await 登録を押す(form); });
  await step(5, async () => {
    // 登録されたイベントは、複製元と同じイベント名(日)で、イベントIDが複製元と違うもの（事前準備で、同名の他イベントは0件）
    found = イベント名で探す(複製元の名前("024")).filter((e) => e.イベントID !== 元);
  });
  await expected(async () => {
    expect(found.length, "複製元と同じ名前で、イベントIDが複製元と違うイベントの件数").toBe(1);
    const e = found[0];
    expect.soft(e && [e["賞品(日)"], ...e.フリー入力エリア.map((a) => a["内容(日)"])], "日本語の項目（賞品・フリー入力エリア1〜3の内容）").toEqual(Array(4).fill(あ));
    expect.soft(e && [e["賞品(英)"], ...e.フリー入力エリア.map((a) => a["内容(英)"])], "英語の項目（賞品・フリー入力エリア1〜3の内容）").toEqual(Array(4).fill(A));
    expect.soft(備考を入れた, "備考(日)・備考(英)に4096文字を入力して登録できた（入力項目がある）").toBe(true);
  });
});

caseTest("IT-M13-05-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-028〕")); });
  await step(2, async () => { await form.fill({ イベント名日: 名.数値8桁, 定員: "99999999", 参加費: "88888888" }); });
  await step(3, async () => { await 登録を押す(form); });
  await step(4, async () => { found = イベント名で探す(名.数値8桁); });
  await expected(async () => {
    expect(found.length, "「数値8桁イベント」の件数").toBe(1);
    expect.soft(found[0]?.定員, "定員").toBe("99999999");
    expect.soft(found[0]?.参加費, "参加費").toBe("88888888");
  });
});

caseTest("IT-M13-05-030", async ({ page, notes, step, expected }) => {
  const 元 = notes.get("〔イベントID-M1305-030〕");
  await loginAdmin(page, M1305_ADMIN);
  const 登録する = async (イベント名: string, ルール適用度: string, 公開状態: string, イベント規模: string | null, チーム戦: boolean) => {
    const form = await openEventCopy(page, 元);
    await form.fill({ イベント名日: イベント名, ルール適用度, 公開状態, チーム戦 });
    if (イベント規模 === null) note(await form.clear(form.イベント規模, "イベント規模"));
    else await form.fill({ イベント規模 });
    await 登録を押す(form);
  };
  let got: Record<string, 保存イベント[]> = {};
  await step(1, async () => { await 登録する(名.選択肢A, "初心者歓迎", "公開", "大型イベント", false); });
  await step(2, async () => { await 登録する(名.選択肢B, "カジュアル対戦", "非公開", "特別イベント", true); });
  await step(3, async () => { await 登録する(名.選択肢C, "上級者向け", "限定公開", null, false); });
  await step(4, async () => { got = { A: イベント名で探す(名.選択肢A), B: イベント名で探す(名.選択肢B), C: イベント名で探す(名.選択肢C) }; });
  await expected(async () => {
    const 値 = (es: 保存イベント[]) => es.map((e) => ({ ルール適用度: e.ルール適用度, 公開状態: e.公開状態, イベント規模: e.イベント規模, チーム戦: e.チーム戦 }));
    expect.soft(値(got.A), "選択肢イベントA").toEqual([{ ルール適用度: "初心者歓迎", 公開状態: "公開", イベント規模: "大型イベント", チーム戦: "偽" }]);
    expect.soft(値(got.B), "選択肢イベントB").toEqual([{ ルール適用度: "カジュアル対戦", 公開状態: "非公開", イベント規模: "特別イベント", チーム戦: "真" }]);
    expect.soft(値(got.C), "選択肢イベントC（イベント規模は未選択＝空）").toEqual([{ ルール適用度: "上級者向け", 公開状態: "限定公開", イベント規模: "", チーム戦: "偽" }]);
  });
});

caseTest("IT-M13-05-031", async ({ page, notes, step, expected }) => {
  const 元 = notes.get("〔イベントID-M1305-031〕");
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, 元); });
  await step(2, async () => { await form.イベント名日.fill(名.新規採番); });
  await step(3, async () => { await 登録を押す(form); });
  await step(4, async () => { found = イベント名で探す(名.新規採番); });
  await expected(async () => {
    expect(found.length, "「新規採番イベント」の件数").toBe(1);
    expect.soft(found[0]?.イベントID, "「新規採番イベント」のイベントID（複製元と違う番号）").not.toBe(元);
    expect.soft(found[0]?.イベントID, "「新規採番イベント」のイベントIDが振られている").toMatch(/^\d+$/);
  });
});

caseTest("IT-M13-05-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  let form!: EventForm;
  let found: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-032〕")); });
  await step(2, async () => { await form.イベント名日.fill(名.登録者確認); });
  await step(3, async () => { await 登録を押す(form); });
  await step(4, async () => { found = イベント名で探す(名.登録者確認); });
  await expected(async () => {
    expect(found.length, "「登録者確認イベント」の件数").toBe(1);
    expect.soft(found[0]?.登録者の管理者ID, "登録者（ログイン中の管理者 m1305_admin の管理者ID）").toBe(notes.get("〔管理者ID-M1305-共有〕"));
  });
});

caseTest("IT-M13-05-033", async ({ page, notes, step, expected }) => {
  const 元 = notes.get("〔イベントID-M1305-033〕");
  await loginAdmin(page, M1305_ADMIN);
  let 前!: 保存イベント | null;
  let 後!: 保存イベント | null;
  let form!: EventForm;
  await step(1, async () => { 前 = 保存されているイベント(元); expect(前, "複製元のイベントがDBにある").not.toBeNull(); });
  await step(2, async () => { form = await openEventCopy(page, 元); });
  await step(3, async () => { await form.イベント名日.fill(名.複製元非更新); });
  await step(4, async () => { await 登録を押す(form); });
  await step(5, async () => { 後 = 保存されているイベント(元); });
  await expected(async () => {
    expect(後, "複製元のイベントがDBにある").not.toBeNull();
    expect.soft(入力項目(後!), "複製元の入力項目（登録前に記録した値と同じ）").toEqual(入力項目(前!));
    note(`複製元の更新日時: 登録前 ${前!.更新日時} ／ 登録後 ${後!.更新日時}`);
  });
});

caseTest("IT-M13-05-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1305_ADMIN);
  const 会場を入れた: boolean[] = [];
  const 入れて登録 = async (form: EventForm, イベント名日: string, イベント名英: string) => {
    await form.fill({ イベント名日, イベント名英, 店舗: 印店名.A, フォーマット: ["形式A"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "100" });
    const ok = await 会場を選ぶ(form, "会場A");
    if (!ok) note(`「${イベント名日}」: 会場の入力項目が画面に無いので、会場Aは入れられなかった`);
    会場を入れた.push(ok);
    await 登録を押す(form);
  };
  let form!: EventForm;
  let 新規: 保存イベント[] = [], 複製: 保存イベント[] = [];
  await step(1, async () => { form = await openEventCreate(page); });
  await step(2, async () => { await 入れて登録(form, 名.新規共通仕様, "New Common Event"); });
  await step(3, async () => { form = await openEventCopy(page, notes.get("〔イベントID-M1305-035〕")); });
  await step(4, async () => { await 入れて登録(form, 名.複製共通仕様, "Duplicate Common Event"); });
  await step(5, async () => { 新規 = イベント名で探す(名.新規共通仕様); 複製 = イベント名で探す(名.複製共通仕様); });
  await expected(async () => {
    const 値 = (es: 保存イベント[]) => es.map((e) => ({ 店舗: e.店舗, フォーマット: e.フォーマット, ルール適用度: e.ルール適用度, 公開状態: e.公開状態, 定員: e.定員, 参加費: e.参加費 }));
    const want = [{ 店舗: 印店名.A, フォーマット: ["形式A"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "100" }];
    expect.soft(値(新規), "イベント登録画面から登録したイベント").toEqual(want);
    expect.soft(値(複製), "複製新規の画面から登録したイベント").toEqual(want);
    expect.soft(会場を入れた, "2件とも会場Aを入れて登録できた（会場の入力項目がある）").toEqual([true, true]);
  });
});

/** 036・037: 複製新規で名前だけ変えて登録し、遷移先（036）・保存成功のメッセージ（037）を見る */
function 名前を変えて登録(n: "036" | "037", イベント名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1305_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventCopy(page, notes.get(`〔イベントID-M1305-${n}〕`)); });
    await step(2, async () => { await form.イベント名日.fill(イベント名); });
    await step(3, async () => { await 登録を押す(form); });
    await expected(async () => {
      if (n === "036") {
        expect(path(page.url()), "遷移した画面のアドレス（イベント一覧）").toMatch(/\/event(\/page\/\d+)?$/);
        return;
      }
      await expect(成功メッセージ(page).first(), "保存成功のメッセージ").toBeVisible();
      note(`表示されたメッセージ: ${(await 成功メッセージ(page).first().innerText()).replace(/\s+/g, " ").trim()}`);
    });
  };
}
caseTest("IT-M13-05-036", 名前を変えて登録("036", 名.遷移確認));
caseTest("IT-M13-05-037", 名前を変えて登録("037", 名.メッセージ確認));

caseTest("IT-M13-05-039", async ({ page, notes, step, expected }) => {
  const 元 = notes.get("〔イベントID-M1305-QK001〕");
  const front = new EventSearchPage(page);
  let 手順1の文 = "", 手順1のカード = -1;
  let 手順6のカード: Awaited<ReturnType<typeof 検索結果のカード>> = [];
  let 詳細!: 大会詳細;
  let 新ID = "";
  const 検索 = async () => {
    await front.open();
    await front.モーダルを開く();
    await front.条件を入れる({ キーワード: 名.QK複製後 });
    note(`大会詳細検索（キーワード「${名.QK複製後}」）の結果の画面の応答: ${await front.検索する()}`);
  };
  await step(1, async () => {
    await 検索();
    手順1の文 = await 結果なしの文(page);
    手順1のカード = (await 検索結果のカード(page)).length;
  });
  await step(2, async () => {
    note(`パスワードはシード表の「Passw0rd-QK」を管理画面が拒む（12文字以上）ので、共有シードで代えた「${QK1302_ADMIN.password}」でログインした（ケースはパスワードの値を確かめない）`);
    await loginAdmin(page, QK1302_ADMIN);
  });
  let form!: EventForm;
  await step(3, async () => { form = await openEventEdit(page, 元); await pressCopy(form, 元); });
  await step(4, async () => {
    await form.イベント名日.fill(名.QK複製後);
    await 登録を押す(form);
    新ID = 編集画面のイベントID(page);
    expect(新ID, "登録して遷移したイベント編集画面のイベントID").toMatch(/^\d+$/);
  });
  await step(5, async () => {
    note("日程登録は、登録後に遷移したイベント編集画面を開き直して「日程追加」を押した（開いている画面と同じイベント）");
    await registerSchedule(page, 新ID, { 開始時間: "2030-10-18 10:00", 受付あり: false, デッキ登録あり: false });
  });
  await step(6, async () => {
    await 検索();
    手順6のカード = await 検索結果のカード(page);
  });
  await step(7, async () => {
    note("検索結果の日程のカード（全体が大会詳細画面へのリンク）を押して、大会詳細画面を開いた");
    await カードから大会詳細を開く(page, 名.QK複製後);
    詳細 = await 大会詳細を読む(page);
  });
  await expected(async () => {
    expect.soft(手順1の文, "手順1の検索結果の文").toContain("条件に合うイベントが見つかりませんでした");
    expect.soft(手順1のカード, "手順1の検索結果に出たイベントの数").toBe(0);
    expect.soft(手順6のカード.length, "手順6の検索結果に出た日程の数").toBe(1);
    const c = 手順6のカード[0];
    expect.soft(c?.イベント名, "手順6の日程のイベント名").toBe(名.QK複製後);
    expect.soft(c?.開催日時の値, "手順6の日程の開催日時（機械向けの値）").toBe("2030-10-18T10:00");
    expect.soft(c?.開催日時の表示, "手順6の日程の開催日時（表示）").toContain("2030年10月18日 10時");
    expect.soft(c?.開催店舗, "手順6の日程の開催店舗").toBe(QK連携店舗);
    expect.soft(詳細.イベント名, "手順7の大会詳細画面のイベント名").toBe(名.QK複製後);
    expect.soft(詳細.ルール適用度, "手順7の大会詳細画面のルール適用度").toBe("初心者歓迎");
    expect.soft(詳細.フォーマット, "手順7の大会詳細画面のフォーマット").toBe("スタンダード");
  });
});
