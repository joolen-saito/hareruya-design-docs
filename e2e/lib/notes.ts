/**
 * 控えた番号。
 * 画面が自動で振る番号（イベントID・日程IDなど）は事前に決められないので、データを画面で作ったときに控え、
 * ケースでは〔イベントID-M1302-002〕のような呼び名で引く（類型T4。integration_test/casegen/seed_screen/README.md）。
 */
const LABEL = /〔[^〕]+〕/g;

export class Notes {
  private readonly map = new Map<string, string>();

  /** 呼び名は〔…〕を含めて書く。同じ呼び名に違う値を控え直すのは誤り（取り違えの検出） */
  set(label: string, value: string | number): void {
    if (!/^〔[^〕]+〕$/.test(label)) throw new Error(`呼び名は〔…〕の形で書く: ${label}`);
    const v = String(value);
    if (!v) throw new Error(`${label} に空の値は控えられない`);
    const old = this.map.get(label);
    if (old !== undefined && old !== v) throw new Error(`${label} は ${old} を控え済みなのに ${v} を控えようとした`);
    this.map.set(label, v);
  }

  get(label: string): string {
    const v = this.map.get(label);
    if (v === undefined) throw new Error(`${label} はまだ控えていない（そのシードを作っていないか、呼び名の誤り）`);
    return v;
  }

  has(label: string): boolean {
    return this.map.has(label);
  }

  /** 文中の呼び名を、控えた番号に置き換える（報告用） */
  resolve(text: string): string {
    return text.replace(LABEL, (l) => (this.map.has(l) ? `${l}=${this.map.get(l)}` : l));
  }

  /** 文に出てくる呼び名 */
  static labelsIn(text: string): string[] {
    return [...new Set(text.match(LABEL) ?? [])];
  }

  entries(): [string, string][] {
    return [...this.map.entries()];
  }

  merge(entries: Iterable<[string, string]>): void {
    for (const [k, v] of entries) this.set(k, v);
  }
}
