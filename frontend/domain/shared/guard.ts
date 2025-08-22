// domain/shared/guard.ts
export class Guard {
    static uuid(v: unknown, name: string): string {
      const s = String(v ?? '').trim();
      if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s)) {
        throw new Error(`${name} invalid uuid`);
      }
      return s;
    }
    static nonEmpty(v: unknown, name: string): string {
      const s = String(v ?? '').trim();
      if (!s) throw new Error(`${name} empty`);
      return s;
    }
    static int(v: unknown, name: string): number {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new Error(`${name} must be integer`);
      return n;
    }
    static posInt(v: unknown, name: string): number {
      const n = this.int(v, name);
      if (n <= 0) throw new Error(`${name} must be > 0`);
      return n;
    }
    static nonNegInt(v: unknown, name: string): number {
      const n = this.int(v, name);
      if (n < 0) throw new Error(`${name} must be >= 0`);
      return n;
    }
    static percentage(v: unknown, name: string): number {
      const n = this.int(v, name);
      if (n < 0 || n > 100) throw new Error(`${name} must be 0..100`);
      return n;
    }
    static bool(v: unknown): boolean { return Boolean(v); }
  
    static isoDate(v: unknown, name: string): string {
      const s = String(v ?? '');
      if (!s || Number.isNaN(Date.parse(s))) throw new Error(`${name} invalid timestamp`);
      return new Date(s).toISOString();
    }
    static dateYMD(v: unknown, name: string): string {
      const s = String(v ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${name} invalid date(YYYY-MM-DD)`);
      return s;
    }
    static timeHM(v: unknown, name: string): string {
      const s = String(v ?? '').trim();
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) throw new Error(`${name} invalid time(HH:MM[:SS])`);
      return s.length === 5 ? `${s}:00` : s;
    }
  
    static stringArray(v: unknown, name: string): string[] {
      if (v == null) return [];
      if (!Array.isArray(v)) throw new Error(`${name} must be array`);
      return v.map(x => String(x));
    }
  
    /** RFC5322 완전 대응은 과하지만, 실무 안전/간단 패턴 */
    static email(v: unknown, name: string): string {
      const s = String(v ?? '').trim();
      // local@domain.tld (공백/연속 @ 금지, TLD 2+)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) {
        throw new Error(`${name} invalid email`);
      }
      return s.toLowerCase();
    }
  }