/** F09-05 その他デッキ一覧（フロント）。正本: cases/F09-05_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DeckResultView, DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { OthersListPage } from "../../pages/front/f09_05_others";
import { フォーマット一覧から編集画面を開く, 欄にチェックを付けて保存する } from "../../pages/admin/f09_05_setup";
import { F0905_ADMIN, N, 選手 } from "../../seeds/f09-05";
import "../../seeds/f09-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 入力欄の注記 = "画面下部の入力欄（フォーマットの選択肢を持つ検索条件の入力欄）は、この画面では画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）として置かれている。モーダルを開いて見た";
const 前印 = (ケース: string, 名: string) => `F0905-${ケース}-${名}`;

/** 手順1・2（デッキ検索TOPを開き、「その他」を押してその他デッキ一覧を開く）。応答の状態を返す */
async function その他を開く(top: DeckTopPage, others: OthersListPage, step: (n: number, b: () => Promise<void>) => Promise<void>, 始め = 1): Promise<number> {
  let status = 0;
  await step(始め, async () => { await top.開く(); });
  await step(始め + 1, async () => { status = await others.開く(top); });
  return status;
}

/** 一覧に載るデッキが、ちょうど「載る」のプレイヤー（並びは問わない）であること（001・002・005・006・009） */
function ちょうど載る(ケース: string, 載る: string[], 載らない: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const others = new OthersListPage(page);
    await その他を開く(top, others, step);
    await expected(async () => {
      const 名前 = await others.プレイヤー名();
      expect.soft([...名前].sort(), `一覧に載るデッキのプレイヤー名（${載る.map((p) => 前印(ケース, p)).join("・")}だけ）`).toEqual(載る.map((p) => N(ケース, p)).sort());
      for (const p of 載らない) expect.soft(名前, `一覧に${前印(ケース, p)}は載らない`).not.toContain(N(ケース, p));
    });
  };
}

caseTest("IT-F09-05-001", ちょうど載る("001", ["選手甲", "選手乙"], []));
caseTest("IT-F09-05-002", ちょうど載る("002", ["選手甲"], ["選手乙", "選手丙", "選手丁"]));

/** フォーマットBを管理画面で対象から外してから、その他デッキ一覧を開き直す（003・004） */
function 対象から外す(ケース: string, 欄: "ランキング表示" | "メタ分布簡易化"): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const others = new OthersListPage(page);
    await その他を開く(top, others, step);
    await step(3, async () => { await loginAdmin(page, F0905_ADMIN); });
    await step(4, async () => { await フォーマット一覧から編集画面を開く(page, N(ケース, "フォーマットB")); });
    await step(5, async () => {
      for (const w of await 欄にチェックを付けて保存する(page, 欄, `フォーマット「${前印(ケース, "フォーマットB")}」の${欄}を付けて保存`)) note(`保存したときの警告: ${w}`);
    });
    await step(6, async () => { await top.開く(); });
    await step(7, async () => { await others.開く(top); });
    await expected(async () => {
      const 名前 = await others.プレイヤー名();
      expect.soft(名前, `フォーマットBを対象から外した後のその他デッキ一覧（${前印(ケース, "選手甲")}だけ）`).toEqual([N(ケース, "選手甲")]);
      expect.soft(名前, `${前印(ケース, "選手乙")}は載らない`).not.toContain(N(ケース, "選手乙"));
    });
  };
}
caseTest("IT-F09-05-003", 対象から外す("003", "ランキング表示"));
caseTest("IT-F09-05-004", 対象から外す("004", "メタ分布簡易化"));

caseTest("IT-F09-05-005", ちょうど載る("005", ["選手甲"], ["選手乙"]));
caseTest("IT-F09-05-006", ちょうど載る("006", ["選手甲"], ["選手乙"]));
caseTest("IT-F09-05-009", ちょうど載る("009", ["選手甲"], ["選手乙"]));

// ---------------------------------------------------------------------------
// 一覧の行の表示
// ---------------------------------------------------------------------------

caseTest("IT-F09-05-010", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    const 行 = (await others.行()).filter((r) => r.プレイヤー === N("010", "選手甲"));
    expect.soft(行.length, "一覧のF0905-010-選手甲の行の数").toBe(1);
    expect.soft(行[0]?.非公開の印, "F0905-010-選手甲の行の非公開の印").toBe(true);
  });
});

caseTest("IT-F09-05-011", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    const 行 = await others.行();
    const 甲 = 行.filter((r) => r.プレイヤー === N("011", "選手甲"));
    const 乙 = 行.filter((r) => r.プレイヤー === N("011", "選手乙"));
    expect.soft(甲.length, "一覧のF0905-011-選手甲の行の数").toBe(1);
    expect.soft(甲[0]?.非公開の印, "F0905-011-選手甲の行の非公開の印（付かない）").toBe(false);
    // 印を正しく読めていること（デッキリスト非公開の乙には印が付く）も、比べる相手として確かめる
    expect.soft(乙[0]?.非公開の印, "比べる相手: デッキリスト非公開のF0905-011-選手乙の行の非公開の印").toBe(true);
  });
});

caseTest("IT-F09-05-012", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    const 行 = (await others.行()).filter((r) => r.プレイヤー === N("012", "選手甲"));
    expect.soft(行.length, "一覧のF0905-012-選手甲の行の数").toBe(1);
    expect.soft(行[0]?.プレイヤー, "行のプレイヤー").toBe(N("012", "選手甲"));
    expect.soft(行[0]?.大会名, "行の大会名").toBe(N("012", "大会"));
    expect.soft(行[0]?.参加人数, "行の参加人数").toBe("64");
    expect.soft(行[0]?.タグ ?? [], "行のデッキタグ（タグ1）").toContain(N("012", "タグ1"));
    expect.soft(行[0]?.タグ ?? [], "行のデッキタグ（タグ2）").toContain(N("012", "タグ2"));
  });
});

caseTest("IT-F09-05-032", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    const 行 = (await others.行()).filter((r) => r.プレイヤー === N("032", "選手甲"));
    expect.soft(行.length, "一覧のF0905-032-選手甲の行の数").toBe(1);
    expect.soft(行[0]?.成績, "F0905-032-選手甲の行の成績").toBe(N("032", "成績"));
  });
});

// ---------------------------------------------------------------------------
// 並び順と件数
// ---------------------------------------------------------------------------

caseTest("IT-F09-05-013", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    expect.soft(await others.プレイヤー名(), "一覧の並び（上から）").toEqual(["05", "06", "04", "03", "02", "01"].map((n) => N("013", `選手${n}`)));
  });
});

const 選手たち = (ケース: string, 件数: number) => Array.from({ length: 件数 }, (_, i) => N(ケース, 選手(i + 1)));

caseTest("IT-F09-05-014", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    expect.soft(await others.プレイヤー名(), "一覧のプレイヤー名（F0905-014-選手01〜20の20件）").toEqual(選手たち("014", 20));
  });
});

caseTest("IT-F09-05-015", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    expect.soft(await others.プレイヤー名(), "一覧のプレイヤー名（F0905-015-選手01〜20の20件すべて）").toEqual(選手たち("015", 20));
  });
});

caseTest("IT-F09-05-033", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    const 名前 = await others.プレイヤー名();
    // 一覧が出ている（0件で「載らない」にならない）ことも確かめる
    expect.soft(名前.length, "一覧に載るデッキの件数（0件でない）").toBeGreaterThan(0);
    expect.soft(名前, "一覧にF0905-033-選手21は載らない").not.toContain(N("033", 選手(21)));
  });
});

caseTest("IT-F09-05-016", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await step(3, async () => { await others.ページ番号を押す(2); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    expect.soft(await new DeckResultView(page).プレイヤー名(), "デッキ検索結果の一覧（F0905-016-選手21の1件だけ）").toEqual([N("016", 選手(21))]);
  });
});

caseTest("IT-F09-05-017", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  const modal = new DeckSearchModal(page);
  await その他を開く(top, others, step);
  await step(3, async () => { await others.ページ番号を押す(2); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    await modal.開く();
    note("デッキ検索結果の検索条件は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）にある。モーダルを開いて見た");
    const l = modal.フォーマットの選択肢のラベル(N("017", "フォーマットA"));
    await expect.soft(l, "検索条件のフォーマットの選択肢に、F0905-017-フォーマットAがある").toHaveCount(1);
    await expect.soft(l.locator("input"), "F0905-017-フォーマットAが選択された状態").toBeChecked();
  });
});

caseTest("IT-F09-05-034", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  let 問い合わせ = "";
  await その他を開く(top, others, step);
  await step(3, async () => {
    await others.ページ番号を押す(2);
    問い合わせ = new URL(page.url()).search;
    note(`開いたデッキ検索結果のアドレスの「?」以降: ${decodeURIComponent(問い合わせ)}`);
    if (!問い合わせ) throw new Error("開いたデッキ検索結果のアドレスに「?」以降が無い");
  });
  await step(4, async () => {
    // 「その他」はデッキ検索TOPにある。デッキ検索TOPを開いてから押した
    await top.開く();
    await others.開く(top);
    note("「その他」はデッキ検索TOPにあるので、デッキ検索TOPを開いてから「その他」を押した");
  });
  await step(5, async () => {
    const url = `${page.url().split("?")[0]}${問い合わせ}`;
    note(`開き直したアドレス: ${decodeURIComponent(url)}`);
    await others.アドレスで開く(url);
  });
  await expected(async () => {
    const 名前 = await others.プレイヤー名();
    expect.soft(名前, "一覧のプレイヤー名（F0905-034-選手01〜20の20件）").toEqual(選手たち("034", 20));
    expect.soft(名前, "一覧にF0905-034-選手21は載らない").not.toContain(N("034", 選手(21)));
  });
});

caseTest("IT-F09-05-030", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  let 総件数 = "";
  await その他を開く(top, others, step);
  await step(3, async () => {
    await expect(others.件数の表示領域, "件数の表示領域").toBeVisible();
    総件数 = await others.総件数();
  });
  await expected(async () => {
    expect.soft(総件数, "件数の表示領域に示される総件数（3件。6件でない）").toBe("3");
    expect.soft(総件数, "総件数が6件でない").not.toBe("6");
  });
});

// ---------------------------------------------------------------------------
// 検索条件の入力欄
// ---------------------------------------------------------------------------

caseTest("IT-F09-05-018", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  const modal = new DeckSearchModal(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    await modal.開く();
    note(入力欄の注記);
    for (const f of ["フォーマットA", "フォーマットB"]) {
      const l = modal.フォーマットの選択肢のラベル(N("018", f));
      await expect.soft(l, `入力欄のフォーマットの選択肢に${前印("018", f)}が載る`).toHaveCount(1);
      await expect.soft(l.locator("input"), `${前印("018", f)}が選択済み`).toBeChecked();
    }
  });
});

caseTest("IT-F09-05-019", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  const modal = new DeckSearchModal(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    await modal.開く();
    note(入力欄の注記);
    const 選択肢 = await modal.フォーマットの選択肢();
    // 選択肢が読めている（空で「現れない」にならない）ことを、検索対象のフォーマットAが出ていることで確かめる
    expect.soft(選択肢, "比べる相手: 検索対象のF0905-019-フォーマットAは選択肢に出る").toContain(N("019", "フォーマットA"));
    expect.soft(選択肢, "入力欄のフォーマットの選択肢にF0905-019-フォーマットCが現れない").not.toContain(N("019", "フォーマットC"));
  });
});

/** 入力欄の「検索」を押してデッキ検索結果を開く（020・021） */
async function 入力欄から検索する(page: import("@playwright/test").Page, step: (n: number, b: () => Promise<void>) => Promise<void>): Promise<DeckSearchModal> {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  const modal = new DeckSearchModal(page);
  await その他を開く(top, others, step);
  await step(3, async () => {
    await modal.開く();
    note(入力欄の注記);
    await modal.検索する();
  });
  return modal;
}

caseTest("IT-F09-05-020", async ({ page, step, expected }) => {
  const modal = await 入力欄から検索する(page, step);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    await modal.開く();
    note("デッキ検索結果の検索条件も、画面上部の「詳細検索」で開くモーダルにある。モーダルを開いて見た");
    for (const f of ["フォーマットA", "フォーマットB"]) {
      const l = modal.フォーマットの選択肢のラベル(N("020", f));
      await expect.soft(l, `検索条件のフォーマットの選択肢に${前印("020", f)}がある`).toHaveCount(1);
      await expect.soft(l.locator("input"), `${前印("020", f)}が選択された状態`).toBeChecked();
    }
  });
});

caseTest("IT-F09-05-021", async ({ page, step, expected }) => {
  await 入力欄から検索する(page, step);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "開いた画面のアドレス（デッキ検索結果）").toBe("/ja/deck/result/");
    const 名前 = await new DeckResultView(page).プレイヤー名();
    expect.soft(名前, "デッキ検索結果の一覧にF0905-021-選手甲が載る").toContain(N("021", "選手甲"));
    expect.soft(名前, "デッキ検索結果の一覧にF0905-021-選手乙が載る").toContain(N("021", "選手乙"));
    expect.soft(名前, "デッキ検索結果の一覧にF0905-021-選手丙は載らない").not.toContain(N("021", "選手丙"));
  });
});

/** 選択肢に対象でないフォーマットAが現れず、対象のフォーマットBが選択済み（036・037） */
function 選択肢と選択状態(ケース: string): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const others = new OthersListPage(page);
    const modal = new DeckSearchModal(page);
    let 選択肢: string[] = [];
    await その他を開く(top, others, step);
    await step(3, async () => {
      await modal.開く();
      note(入力欄の注記);
      選択肢 = await modal.フォーマットの選択肢();
    });
    await expected(async () => {
      expect.soft(選択肢, `入力欄のフォーマットの選択肢に${前印(ケース, "フォーマットA")}が現れない`).not.toContain(N(ケース, "フォーマットA"));
      const l = modal.フォーマットの選択肢のラベル(N(ケース, "フォーマットB"));
      await expect.soft(l, `入力欄のフォーマットの選択肢に${前印(ケース, "フォーマットB")}が載る`).toHaveCount(1);
      await expect.soft(l.locator("input"), `${前印(ケース, "フォーマットB")}が選択済み`).toBeChecked();
    });
  };
}
caseTest("IT-F09-05-036", 選択肢と選択状態("CB036"));
caseTest("IT-F09-05-037", 選択肢と選択状態("CB037"));

// ---------------------------------------------------------------------------
// 利用者の検索条件を受け取らない
// ---------------------------------------------------------------------------

caseTest("IT-F09-05-023", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  const modal = new DeckSearchModal(page);
  let 問い合わせ = "";
  await step(1, async () => { await top.開く(); });
  await step(2, async () => {
    await modal.開く();
    note("プレイヤー名の入力欄は、画面上部の「詳細検索」で開くモーダル（デッキ詳細検索）の中にある。モーダルを開いてから入力した");
    await modal.入れる("player", N("023", "選手乙"));
    await modal.検索する();
    問い合わせ = new URL(page.url()).search;
    note(`開いたデッキ検索結果のアドレスの「?」以降: ${decodeURIComponent(問い合わせ)}`);
    if (!問い合わせ) throw new Error("開いたデッキ検索結果のアドレスに「?」以降が無い");
  });
  await step(3, async () => { await top.開く(); });
  await step(4, async () => { await others.開く(top); });
  await step(5, async () => {
    const url = `${page.url().split("?")[0]}${問い合わせ}`;
    note(`開き直したアドレス: ${decodeURIComponent(url)}`);
    await others.アドレスで開く(url);
  });
  await expected(async () => {
    expect.soft([...(await others.プレイヤー名())].sort(), "一覧に載るデッキ（F0905-023-選手甲とF0905-023-選手乙の2件）").toEqual([N("023", "選手甲"), N("023", "選手乙")].sort());
  });
});

// ---------------------------------------------------------------------------
// 0件のとき・応答の状態
// ---------------------------------------------------------------------------

/** 一覧の領域に該当なしの案内が出て、デッキが1件も並ばない（024・026） */
function 該当なし(): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const others = new OthersListPage(page);
    await その他を開く(top, others, step);
    await expected(async () => {
      await expect.soft(others.該当なしの案内, "一覧の領域の該当なしの案内").toBeVisible();
      await expect.soft(others.一覧の項目, "一覧に並ぶデッキの数").toHaveCount(0);
    });
  };
}
caseTest("IT-F09-05-024", 該当なし());
caseTest("IT-F09-05-026", 該当なし());

/** その他デッキ一覧のページ取得の応答の状態が 200（025・027・028） */
function 応答の状態(): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new DeckTopPage(page);
    const others = new OthersListPage(page);
    const 記録: { url: string; status: number }[] = [];
    let status = 0;
    await step(1, async () => {
      page.on("response", (r) => {
        if (r.request().isNavigationRequest() && /\/deck\/others\//.test(new URL(r.url()).pathname)) 記録.push({ url: decodeURIComponent(r.url()), status: r.status() });
      });
      note("開発者ツールのネットワークの記録の代わりに、ブラウザが受け取る画面の取得の応答のうち、その他デッキ一覧のものを記録し始めた");
    });
    await その他を開く(top, others, step, 2);
    await step(4, async () => {
      if (記録.length !== 1) throw new Error(`記録したその他デッキ一覧のページ取得が1件でない（${記録.length}件）`);
      status = 記録[0].status;
      note(`記録したその他デッキ一覧のページ取得: ${記録[0].url}（応答 ${status}）`);
    });
    await expected(async () => {
      expect.soft(status, "その他デッキ一覧のページ取得の HTTP ステータス").toBe(200);
    });
  };
}
caseTest("IT-F09-05-025", 応答の状態());
caseTest("IT-F09-05-027", 応答の状態());
caseTest("IT-F09-05-028", 応答の状態());

caseTest("IT-F09-05-035", async ({ page, step, expected }) => {
  const top = new DeckTopPage(page);
  const others = new OthersListPage(page);
  await その他を開く(top, others, step);
  await expected(async () => {
    // 画面の組み立てが済んでいる（一覧の領域が出ている）ことを確かめてから見る
    await expect.soft(others.該当なしの案内, "一覧の領域の該当なしの案内（画面が組み上がっている）").toBeVisible();
    await expect.soft(others.件数の表示領域, "件数の表示領域").toBeHidden();
  });
});
