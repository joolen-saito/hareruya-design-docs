/**
 * ケース専用のシードの使い回し（依頼者決定 2026-11-11「シードの使い回しを進めて」）。
 *
 * シード表で中身が同じ（番号・名前だけ違う）ケース専用のシードのうち、使うケースがそのデータの状態を変えず（閲覧・画面の移動など）、
 * 件数・履歴を数えないものだけを、1回の起動（プロセス）の中で1度だけ作って使い回す。どの組を使い回すかは、各機能の作り方（seeds/<機能>.ts）に書く。
 * - 作るのは、いつも元のシード（canonical）の定め。使い回す側のシードを先に頼まれても、元のシードの定め（名前・コード）で作る。
 * - 控えた番号は、元のシードの呼び名で控えたものを、使い回す側のシードの呼び名へ読み替えて控える（rename）。
 * - 使い回した側のシードには、エビデンスの注記に出るよう reportSeedIssue で残す。
 */
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";

const built = new Map<string, Promise<[string, string][]>>();

export async function 使い回して作る(a: {
  /** いま頼まれたシード */ seedId: string;
  /** 元のシード（実際に作るのはこの定め） */ canonical: string;
  /** ケースの控えた番号（共有シードが控えたものも入っている） */ notes: Notes;
  /** 元のシードの呼び名を、いま頼まれたシードの呼び名へ読み替える */ rename: (label: string) => string;
  /** 元のシードの定めで作り、控えた番号を n に控える */ build: (n: Notes) => Promise<void>;
}): Promise<void> {
  let p = built.get(a.canonical);
  if (!p) {
    p = (async () => {
      const n = new Notes();
      const before = new Set(a.notes.entries().map(([k]) => k));
      n.merge(a.notes.entries());
      await a.build(n);
      return n.entries().filter(([k]) => !before.has(k));
    })();
    built.set(a.canonical, p);
    p.catch(() => built.delete(a.canonical));
  }
  const entries = await p;
  for (const [l, v] of entries) a.notes.set(a.seedId === a.canonical ? l : a.rename(l), v);
  if (a.seedId !== a.canonical) {
    reportSeedIssue(a.seedId, `${a.seedId} を作らず、同じ中身の ${a.canonical} が作ったものを使った（依頼者決定 2026-11-11 シードの使い回し。このケースはデータの状態を変えない）`);
  }
}
