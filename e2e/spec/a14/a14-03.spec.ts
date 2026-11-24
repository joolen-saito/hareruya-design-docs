/**
 * A14-03 カード情報1件の取得（GET /card?name={name}&lang={lang}）。正本: cases/A14-03_test_cases.tsv
 * 実装したケースと解釈は記録 review/A14-03_progress_2026-11-24_dev.md。
 *
 * 「ブラウザで URL を開く・開発者ツールの Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API（config/env.ts の API_BASE_URL）へ認証なしの GET を送り、HTTP ステータスと応答本文（JSON）を読む。
 * 要求のアドレスは、正本の手順の「…」の中の文をそのまま使う（手順から読み取る）。
 */
import { test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { stepsOf } from "../../lib/catalog";
import "../../seeds/a14-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };
const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** 手順を正本の並びで実行する。「/card…」を開く手順は GET を送る。送った応答を順に返す */
async function 流す(ctx: CaseCtx): Promise<応答[]> {
  const rs: 応答[] = [];
  for (const [i, 文] of stepsOf(ctx.c).entries()) {
    await ctx.step(i + 1, async () => {
      const m = /「(\/card[^」]*)」/.exec(文);
      if (m) {
        const url = new URL(API_BASE_URL + m[1]).href;
        const res = await ctx.page.request.get(url, { failOnStatusCode: false, timeout: 120_000 });
        const 本文 = await res.text();
        const r = { ステータス: res.status(), 本文, json: 読む(本文) };
        rs.push(r);
        supplement("ブラウザで開く代わりに、試験ブラウザから API へ認証なしの GET を送り、応答の HTTP ステータスと本文を読んだ");
        note(`GET ${m[1]}・応答 HTTP ${r.ステータス}・本文 ${本文.slice(0, 400)}`);
      } else if (/開発者ツール/.test(文)) {
        supplement("開発者ツールの代わりに、試験ブラウザから API へ要求を送り、応答を読む");
      } else {
        note(rs.length ? `直近の応答: HTTP ${rs[rs.length - 1].ステータス}・${rs[rs.length - 1].本文.slice(0, 200)}` : "（応答の確認）");
      }
    });
  }
  return rs;
}
const j = (r: 応答): Record<string, unknown> => r.json ?? {};

caseTest("IT-A14-03-001", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-001〕")));
    expect.soft(j(r).name_jp, "name_jp").toBe("基本検索カード-001");
    expect.soft(j(r).name_en, "name_en").toBe("Basic-001 Search Card");
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-001/base-en.jpg");
  });
});
caseTest("IT-A14-03-007", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-007〕")));
    expect.soft(j(r).name_en, "name_en").toBe("Fire-007/Ice");
  });
});
caseTest("IT-A14-03-008", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-008〕")));
    expect.soft(j(r).name_jp, "name_jp").toBe("火/氷");
  });
});
caseTest("IT-A14-03-011", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-011〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-011/lang-en.jpg");
  });
});
caseTest("IT-A14-03-012", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-012〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-012/lang-en.jpg");
  });
});
caseTest("IT-A14-03-013", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-013〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-013/lang-jp.jpg");
  });
});
caseTest("IT-A14-03-014", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-014〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-014/lang-en.jpg");
  });
});
caseTest("IT-A14-03-015", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-015A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-015/non-special.jpg");
  });
});
caseTest("IT-A14-03-016", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-016B〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-016/release-new.jpg");
  });
});
caseTest("IT-A14-03-017", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-017A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-017/non-foil.jpg");
  });
});
caseTest("IT-A14-03-018", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-018A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-018/non-promotion.jpg");
  });
});
caseTest("IT-A14-03-019", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-019A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-019/a-lang-win.jpg");
  });
});
caseTest("IT-A14-03-020", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-020A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-020/a-special-win.jpg");
  });
});
caseTest("IT-A14-03-021", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-021A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-021/a-release-win.jpg");
  });
});
caseTest("IT-A14-03-022", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-022A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-022/a-foil-win.jpg");
  });
});
caseTest("IT-A14-03-024", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-024〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-024/only-en.jpg");
  });
});
caseTest("IT-A14-03-025", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-025A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-025/a-en.jpg");
  });
});
caseTest("IT-A14-03-026", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-026A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-026/a-en.jpg");
  });
});
caseTest("IT-A14-03-027", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-027A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-027/a-en.jpg");
  });
});
caseTest("IT-A14-03-028", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-028A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-028/a-en.jpg");
  });
});
caseTest("IT-A14-03-029", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-029A〕")));
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-029/a-en.jpg");
  });
});
caseTest("IT-A14-03-034", async (ctx) => {
  const rs = await 流す(ctx);
  const r = rs[rs.length - 1];
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).id, "カードID（整数）").toBe(Number(ctx.notes.get("〔カードID-A1403-034〕")));
    expect.soft(j(r).name_jp, "name_jp").toBe("日英完全一致カード-A1403-034");
    expect.soft(j(r).name_en, "name_en").toBe("Both-A1403-034 Match Card");
    expect.soft(j(r).image_url, "image_url").toBe("img/goods/a14-03-034/both-jp.jpg");
  });
});
caseTest("IT-A14-03-009", async (ctx) => {
  const rs = await 流す(ctx);
  await ctx.expected(async () => {
    expect.soft(rs.length, "要求の数").toBe(3);
    for (const [i, r] of rs.entries()) {
      expect.soft(r.ステータス, `HTTP ステータス（${i + 1}件目）`).toBe(404);
      expect.soft(JSON.stringify(j(r)), `応答本文にコード項目とメッセージ「Not Found」が含まれる（${i + 1}件目）`).toContain("Not Found");
      expect.soft(Object.keys(j(r)).some((x) => /code/i.test(x)), `応答本文にコード項目が含まれる（${i + 1}件目）`).toBe(true);
    }
  });
});
caseTest("IT-A14-03-010", async (ctx) => {
  const rs = await 流す(ctx);
  await ctx.expected(async () => {
    expect.soft(rs.length, "要求の数").toBe(1);
    for (const [i, r] of rs.entries()) {
      expect.soft(r.ステータス, `HTTP ステータス（${i + 1}件目）`).toBe(404);
    }
  });
});
caseTest("IT-A14-03-033", async (ctx) => {
  const rs = await 流す(ctx);
  await ctx.expected(async () => {
    expect.soft(rs.length, "要求の数").toBe(3);
    for (const [i, r] of rs.entries()) {
      expect.soft(r.ステータス, `HTTP ステータス（${i + 1}件目）`).toBe(404);
      expect.soft(JSON.stringify(j(r)), `応答本文にコード項目とメッセージ「Not Found」が含まれる（${i + 1}件目）`).toContain("Not Found");
      expect.soft(Object.keys(j(r)).some((x) => /code/i.test(x)), `応答本文にコード項目が含まれる（${i + 1}件目）`).toBe(true);
    }
  });
});
caseTest("IT-A14-03-035", async (ctx) => {
  const rs = await 流す(ctx);
  await ctx.expected(async () => {
    expect.soft(rs.length, "要求の数").toBe(1);
    for (const [i, r] of rs.entries()) {
      expect.soft(r.ステータス, `HTTP ステータス（${i + 1}件目）`).toBe(404);
      expect.soft(JSON.stringify(j(r)), `応答本文にコード項目とメッセージ「Not Found」が含まれる（${i + 1}件目）`).toContain("Not Found");
      expect.soft(Object.keys(j(r)).some((x) => /code/i.test(x)), `応答本文にコード項目が含まれる（${i + 1}件目）`).toBe(true);
    }
  });
});
