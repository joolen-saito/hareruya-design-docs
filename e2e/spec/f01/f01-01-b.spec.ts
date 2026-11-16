/**
 * F01-01 本店ECTOP（共有の固定タグ・本店TOPの商品の欄が前提のケース）。正本: cases/F01-01_test_cases.tsv
 * 前提は seeds/f01-01-case.ts が作る。共有の固定タグの対象を書き換え、ケースの終わりに必ず元に戻す（lib/shared_restore.ts）。
 * 共有の設定を書き換えるので、これらのケースは1本だけで流す（config/solo_cases.tsv）。
 * 実装しないケースの理由は PM への報告に書く（このファイルには実装したケースだけがある）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { F0101TopPage } from "../../pages/front/f01_01_top";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { CartPage } from "../../pages/front/f04_01_cart";
import { 試験商品の名前 } from "../../pages/admin/f01_01_shared";
import { 会員の資格 } from "../../seeds/f01-01";
import { 作った } from "../../seeds/f01-01-case";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 見出し = {
  ja: { 最新入荷: "最新入荷アイテム", セール: "SALE開催中", 値下げ: "値下げしました！", 補充: "補充しました！", お気に入り: "あなたのお気に入り" },
  en: { Trending: "Trending Now", セール: "On Sale", 値下げ: "Price Down!", 補充: "Restocked!", お気に入り: "Your Favorites" },
} as const;
const 名 = 試験商品の名前;

/** 会員でログインする（会員ログイン画面。ログイン後の画面がログイン画面のままなら落とす） */
async function ログインする(page: CaseCtx["page"], n: string): Promise<void> {
  const { メール, パスワード } = 会員の資格(n);
  await new FrontFavorite(page).login(メール, パスワード);
}

// ---- 表示条件を満たす商品が0件の欄は出ない ----
caseTest("IT-F01-01-016", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let ja = -1; let en = -1;
  await step(1, async () => { await top.本店TOPを開く("ja"); ja = await top.欄(見出し.ja.最新入荷).count(); });
  await step(2, async () => { await top.本店TOPを開く("en"); en = await top.欄(見出し.en.Trending).count(); });
  await expected(async () => {
    expect.soft(ja, "日本語版本店TOPの最新入荷アイテム欄の数").toBe(0);
    expect.soft(en, "英語版本店TOPのTrending Now欄の数").toBe(0);
  });
});
caseTest("IT-F01-01-035", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await expected(async () => { expect.soft(await top.欄(見出し.ja.セール).count(), "SALE開催中欄の数").toBe(0); });
});
caseTest("IT-F01-01-051", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await expected(async () => {
    expect.soft(await top.欄(見出し.ja.値下げ).count(), "値下げしました！欄の数").toBe(0);
    expect.soft(await top.欄(見出し.ja.補充).count(), "補充しました！欄の数").toBe(0);
  });
});

// ---- 公開・言語・在庫の条件を満たさない商品は欄に出ない ----
function 除外(言語: "ja" | "en", 欄名: string, n: string, 出る: string, 出ない: string[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let names: string[] = [];
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => { names = await top.商品名の一覧(top.欄(欄名)); });
    await expected(async () => {
      expect.soft(names, `${欄名}欄に表示されている商品`).toEqual([名(`F0101-${n}-${出る}`)]);
      for (const x of 出ない) expect.soft(names.includes(名(`F0101-${n}-${x}`)), `${欄名}欄に商品 F0101-${n}-${x} が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-F01-01-079", 除外("ja", 見出し.ja.最新入荷, "079", "A", ["B", "C", "D"]));
caseTest("IT-F01-01-080", 除外("en", 見出し.en.Trending, "080", "A", ["B", "C", "D"]));
caseTest("IT-F01-01-086", 除外("ja", 見出し.ja.セール, "086", "A", ["B", "C", "D"]));
caseTest("IT-F01-01-090", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let 値下げ: string[] = []; let 補充: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => {
    値下げ = await top.商品名の一覧(top.欄(見出し.ja.値下げ));
    補充 = await top.商品名の一覧(top.欄(見出し.ja.補充));
  });
  await expected(async () => {
    expect.soft(値下げ, "値下げしました！欄に表示されている商品").toEqual([名("F0101-090-D1")]);
    expect.soft(補充, "補充しました！欄に表示されている商品").toEqual([名("F0101-090-R1")]);
    for (const x of ["D2", "D3", "D4"]) expect.soft(値下げ.includes(名(`F0101-090-${x}`)), `値下げしました！欄に ${x} が表示されない`).toBe(false);
    for (const x of ["R2", "R3", "R4"]) expect.soft(補充.includes(名(`F0101-090-${x}`)), `補充しました！欄に ${x} が表示されない`).toBe(false);
  });
});

// ---- 在庫がちょうど1の商品が表示される ----
function 在庫1(言語: "ja" | "en", 欄名: string, n: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let names: string[] = [];
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => { names = await top.商品名の一覧(top.欄(欄名)); });
    await expected(async () => { expect.soft(names, `${欄名}欄に表示されている商品`).toContain(名(`F0101-${n}-A`)); });
  };
}
caseTest("IT-F01-01-112", 在庫1("ja", 見出し.ja.最新入荷, "112"));
caseTest("IT-F01-01-113", 在庫1("en", 見出し.en.Trending, "113"));
caseTest("IT-F01-01-114", 在庫1("ja", 見出し.ja.セール, "114"));
caseTest("IT-F01-01-115", 在庫1("ja", 見出し.ja.値下げ, "115"));
caseTest("IT-F01-01-116", 在庫1("ja", 見出し.ja.補充, "116"));

// ---- 言語・タグが違う商品は欄に出ない ----
function 欄が出ない(言語: "ja" | "en", 欄名: string, 商品コード: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let 欄の数 = -1;
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => { 欄の数 = await top.欄(欄名).count(); });
    await expected(async () => {
      expect.soft(欄の数, `${欄名}欄の数`).toBe(0);
      expect.soft(await top.画面のどこにも出ていない(名(商品コード)), `商品 ${商品コード} が画面のどの欄にも表示されない`).toBe(true);
    });
  };
}
caseTest("IT-F01-01-118", 欄が出ない("ja", 見出し.ja.最新入荷, "F0101-CB118-A"));
caseTest("IT-F01-01-119", 欄が出ない("en", 見出し.en.Trending, "F0101-CB119-A"));
caseTest("IT-F01-01-120", 欄が出ない("en", 見出し.en.セール, "F0101-CB120-A"));
caseTest("IT-F01-01-121", 在庫1("en", 見出し.en.セール, "CB121"));
caseTest("IT-F01-01-122", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let セール: string[] = []; let 値下げ: string[] = []; let 補充: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => {
    セール = await top.商品名の一覧(top.欄(見出し.ja.セール));
    値下げ = await top.商品名の一覧(top.欄(見出し.ja.値下げ));
    補充 = await top.商品名の一覧(top.欄(見出し.ja.補充));
  });
  await expected(async () => {
    expect.soft(セール, "SALE開催中欄の商品").toEqual([名("F0101-CB122-S")]);
    expect.soft(値下げ, "値下げしました！欄の商品").toEqual([名("F0101-CB122-D")]);
    expect.soft(補充, "補充しました！欄の商品").toEqual([名("F0101-CB122-R")]);
    expect.soft(await top.画面のどこにも出ていない(名("F0101-CB122-U")), "タグに登録されていない商品 U が、どの欄にも表示されない").toBe(true);
  });
});

// ---- SALEラベル（セールフラグ1の商品だけに付く） ----
function SALEラベル(言語: "ja" | "en", 欄名: string, n: string, 会員?: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    if (会員) {
      // 事前準備②: 会員でログイン済みのブラウザにする（ログイン済みのブラウザの用意は事前準備。手順は本店TOPを開くところから）
      await ログインする(page, 会員);
      note("事前準備で、会員のログイン画面から会員でログインしてログイン済みのブラウザにした");
    }
    let a = -1; let b = -1;
    await step(1, async () => { await top.本店TOPを開く(言語); });
    await step(2, async () => {
      const 欄 = top.欄(欄名);
      a = await top.カードのSALEラベル(top.商品のカード(欄, 名(`F0101-${n}-A`))).count();
      b = await top.カードのSALEラベル(top.商品のカード(欄, 名(`F0101-${n}-B`))).count();
    });
    await expected(async () => {
      expect.soft(a, `${欄名}欄の商品 F0101-${n}-A（セールフラグ1）のSALEラベルの数`).toBeGreaterThan(0);
      expect.soft(b, `${欄名}欄の商品 F0101-${n}-B（セールフラグ0）のSALEラベルの数`).toBe(0);
    });
  };
}
caseTest("IT-F01-01-087", SALEラベル("ja", 見出し.ja.セール, "087"));
caseTest("IT-F01-01-089", SALEラベル("ja", 見出し.ja.お気に入り, "089", "089"));
caseTest("IT-F01-01-091", SALEラベル("ja", 見出し.ja.値下げ, "091"));
caseTest("IT-F01-01-092", SALEラベル("ja", 見出し.ja.補充, "092"));

// ---- カード言語・Foil・カード以外の商品 ----
function 混在(欄名: string, n: string, 会員?: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const 読む = { A: { 名: "", 言語: [] as string[] }, B: { 名: "", 言語: [] as string[] }, C: { 名: "", 言語: [] as string[] } };
    const 開く = async () => { await top.本店TOPを開く("ja"); };
    const 確認 = async () => {
      const 欄 = top.欄(欄名);
      for (const k of ["A", "B", "C"] as const) {
        const card = top.商品のカード(欄, 名(`F0101-${n}-${k}`));
        読む[k].名 = ((await top.カードの商品名(card).textContent()) ?? "").replace(/\s+/g, " ").trim();
        読む[k].言語 = (await top.カードのカード言語(card).allInnerTexts()).map((t) => t.trim());
      }
    };
    if (会員) {
      await step(1, async () => { await ログインする(page, n); });
      await step(2, async () => { await 開く(); });
      await step(3, async () => { await 確認(); });
    } else {
      await step(1, async () => { await 開く(); });
      await step(2, async () => { await 確認(); });
    }
    await expected(async () => {
      expect.soft(読む.A.名.startsWith("【Foil】"), `商品 A（Foilあり）の商品名「${読む.A.名}」が【Foil】で始まる`).toBe(true);
      expect.soft(読む.B.名.includes("【Foil】"), `商品 B（Foilなし）の商品名「${読む.B.名}」に【Foil】が付かない`).toBe(false);
      expect.soft(読む.C.名.includes("【Foil】"), `商品 C（カード以外）の商品名「${読む.C.名}」に【Foil】が付かない`).toBe(false);
      expect.soft(読む.A.言語[0], "商品 A のカード言語").toBe("JP");
      expect.soft(読む.B.言語[0], "商品 B のカード言語").toBe("JP");
      expect.soft(読む.C.言語.length, "カード以外の商品 C のカード言語の数").toBe(0);
    });
  };
}
caseTest("IT-F01-01-105", 混在(見出し.ja.最新入荷, "105"));
caseTest("IT-F01-01-106", 混在(見出し.ja.セール, "106"));
caseTest("IT-F01-01-107", 混在(見出し.ja.お気に入り, "107", "107"));
caseTest("IT-F01-01-108", 混在(見出し.ja.値下げ, "108"));
caseTest("IT-F01-01-109", 混在(見出し.ja.補充, "109"));

// ---- あなたのお気に入り欄 ----
caseTest("IT-F01-01-088", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  await ログインする(page, "088");
  note("事前準備②で、会員のログイン画面から会員でログインしてログイン済みのブラウザにした");
  let names: string[] = [];
  await step(1, async () => { await top.本店TOPを開く("ja"); });
  await step(2, async () => { names = await top.商品名の一覧(top.欄(見出し.ja.お気に入り)); });
  await expected(async () => {
    expect.soft(names, "あなたのお気に入り欄に表示されている商品").toEqual([名("F0101-088-A")]);
    expect.soft(names.includes(名("F0101-088-B")), "非公開の商品 B が表示されない").toBe(false);
    expect.soft(names.includes(名("F0101-088-C")), "英語の商品 C が表示されない").toBe(false);
  });
});
function お気に入り欄(言語: "ja" | "en", n: string, 期待: "ある" | "ない", コード: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const 欄名 = 言語 === "ja" ? 見出し.ja.お気に入り : 見出し.en.お気に入り;
    let 欄の数 = -1; let names: string[] = [];
    await step(1, async () => { await ログインする(page, n); });
    await step(2, async () => { await top.本店TOPを開く(言語); });
    await step(3, async () => { 欄の数 = await top.欄(欄名).count(); names = await top.商品名の一覧(top.欄(欄名)); });
    await expected(async () => {
      if (期待 === "ない") {
        expect.soft(欄の数, `${欄名}欄の数`).toBe(0);
        expect.soft(await top.画面のどこにも出ていない(名(コード)), `商品 ${コード} が表示されない`).toBe(true);
      } else {
        expect.soft(欄の数, `${欄名}欄の数`).toBeGreaterThan(0);
        expect.soft(names, `${欄名}欄に表示されている商品`).toContain(名(コード));
      }
    });
  };
}
caseTest("IT-F01-01-123", お気に入り欄("en", "123", "ない", "F0101-CB123-A"));
caseTest("IT-F01-01-124", お気に入り欄("en", "124", "ある", "F0101-CB124-A"));
caseTest("IT-F01-01-125", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let names: string[] = [];
  await step(1, async () => { await ログインする(page, "125"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); });
  await step(3, async () => { names = await top.商品名の一覧(top.欄(見出し.ja.お気に入り)); });
  await expected(async () => {
    expect.soft(names, "あなたのお気に入り欄に表示されている商品").toEqual([名("F0101-CB125-F")]);
    expect.soft(names.includes(名("F0101-CB125-N")), "お気に入り登録していない商品 N が表示されない").toBe(false);
  });
});

// ---- ♡マーク（お気に入り登録済みなら塗りつぶし） ----
function ハート(n: string, ログインする有無: boolean, 期待: boolean) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    let 押されている = "";
    let k = 1;
    if (ログインする有無) await step(k++, async () => { await ログインする(page, n); });
    await step(k++, async () => { await top.本店TOPを開く("ja"); });
    await step(k++, async () => {
      const card = top.商品のカード(top.欄(見出し.ja.最新入荷), 名(`F0101-CB${n}-A`));
      押されている = (await top.カードのお気に入りボタン(card).getAttribute("aria-pressed")) ?? "";
    });
    await expected(async () => {
      expect.soft(押されている, `最新入荷アイテム欄の商品 F0101-CB${n}-A のお気に入りボタンの選択状態（♡が塗りつぶされているときは true）`).toBe(String(期待));
    });
  };
}
caseTest("IT-F01-01-126", ハート("126", true, true));
caseTest("IT-F01-01-127", ハート("127", true, false));
caseTest("IT-F01-01-128", ハート("128", false, false));

// ---- お気に入りの追加・解除（本店TOPの最新入荷アイテム欄から） ----
async function お気に入りを押して反映を待つ(top: F0101TopPage, コード: string, 押した後: boolean): Promise<void> {
  const card = top.商品のカード(top.欄(見出し.ja.最新入荷), 名(コード));
  const btn = top.カードのお気に入りボタン(card);
  await btn.click();
  await expect.poll(async () => (await btn.getAttribute("aria-pressed")) ?? "", { message: "お気に入りボタンの選択状態が変わる", timeout: 20_000 }).toBe(String(押した後));
}
caseTest("IT-F01-01-103", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let 前の欄 = -1; let names: string[] = []; let 欄の数 = -1;
  await step(1, async () => { await ログインする(page, "103"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 前の欄 = await top.欄(見出し.ja.お気に入り).count(); });
  await step(3, async () => { await お気に入りを押して反映を待つ(top, "F0101-103-A", true); });
  await step(4, async () => { await top.本店TOPを開く("ja"); });
  await step(5, async () => { 欄の数 = await top.欄(見出し.ja.お気に入り).count(); names = await top.商品名の一覧(top.欄(見出し.ja.お気に入り)); });
  await expected(async () => {
    expect.soft(前の欄, "押す前のあなたのお気に入り欄の数").toBe(0);
    expect.soft(欄の数, "開き直したあとのあなたのお気に入り欄の数").toBeGreaterThan(0);
    expect.soft(names, "あなたのお気に入り欄に表示されている商品").toEqual([名("F0101-103-A")]);
  });
});
caseTest("IT-F01-01-104", async ({ page, step, expected }) => {
  const top = new F0101TopPage(page);
  let 前の商品: string[] = []; let 欄の数 = -1;
  await step(1, async () => { await ログインする(page, "104"); });
  await step(2, async () => { await top.本店TOPを開く("ja"); 前の商品 = await top.商品名の一覧(top.欄(見出し.ja.お気に入り)); });
  await step(3, async () => { await お気に入りを押して反映を待つ(top, "F0101-104-A", false); });
  await step(4, async () => { await top.本店TOPを開く("ja"); });
  await step(5, async () => { 欄の数 = await top.欄(見出し.ja.お気に入り).count(); });
  await expected(async () => {
    expect.soft(前の商品, "押す前のあなたのお気に入り欄に表示されている商品").toContain(名("F0101-104-A"));
    expect.soft(欄の数, "解除して開き直したあとのあなたのお気に入り欄の数").toBe(0);
  });
});

// ---- カートに入れる（最新入荷アイテム欄の商品数の表示と、カート画面の数量） ----
function カート(n: string, 数量: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const top = new F0101TopPage(page);
    const コード = `F0101-${n}-A`;
    const card = () => top.商品のカード(top.欄(見出し.ja.最新入荷), 名(コード));
    let 行: string[] = []; let 数 = "";
    await step(1, async () => { await top.本店TOPを開く("ja"); });
    await step(2, async () => {
      const q = top.カードの数量欄(card());
      for (let i = 0; i < 5 && (await q.inputValue()) !== "1"; i++) await top.カードの数量ボタン(card(), "マイナス").click();
      expect(await q.inputValue(), "商品数の表示").toBe("1");
    });
    if (数量 > 1) {
      await step(3, async () => {
        for (let i = 0; i < 数量 - 1; i++) await top.カードの数量ボタン(card(), "プラス").click();
        expect(await top.カードの数量欄(card()).inputValue(), "商品数の表示").toBe(String(数量));
      });
    }
    await step(数量 > 1 ? 4 : 3, async () => {
      await top.カードのカートボタン(card()).click();
      // 画面右下の通知（カートに入った知らせ）が出るのを待つ。出ない画面でも、次の手順でカート画面の中身を確かめる
      await page.locator("#hareruya-app-cart-popup.is-visible").waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    });
    await step(数量 > 1 ? 5 : 4, async () => {
      const cart = new CartPage(page);
      await cart.開く();
      行 = await cart.行の商品規格ID();
      const m = 作った.get(コード)!;
      数 = 行.includes(m.規格ID) ? await cart.数量(m.規格ID) : "（カートに無い）";
    });
    await expected(async () => {
      expect.soft(数, `カート画面の商品 ${コード} の数量`).toBe(String(数量));
    });
  };
}
caseTest("IT-F01-01-101", カート("101", 1));
caseTest("IT-F01-01-117", カート("117", 3));
