import { describe, it, expect } from 'vitest';
import { ganhoRange, todayLocalISODate, formatCalendarDate } from './dates';

describe('ganhoRange (T07 — CA-01)', () => {
  it('devolve o mês de setembro como dia de calendário UTC', () => {
    expect(ganhoRange(2026, 8)).toEqual({
      start: '2026-09-01T00:00:00.000Z',
      end: '2026-09-30T23:59:59.999Z',
    });
  });

  it('termina fevereiro no último dia do mês', () => {
    expect(ganhoRange(2026, 1).end).toBe('2026-02-28T23:59:59.999Z');
  });
});

describe('todayLocalISODate (T09 — CA-03)', () => {
  it('usa a data local, e não a UTC, às 22:30 de 30/09', () => {
    expect(todayLocalISODate(new Date(2026, 8, 30, 22, 30))).toBe('2026-09-30');
  });
});

describe('formatCalendarDate (T10 — CA-04)', () => {
  it('formata a venda à meia-noite UTC sem deslocar um dia', () => {
    expect(formatCalendarDate('2026-09-01T00:00:00Z')).toBe('01/09/2026');
  });

  it('formata uma data pura a partir dos próprios dígitos', () => {
    expect(formatCalendarDate('1990-05-12')).toBe('12/05/1990');
  });

  it('devolve N/A quando vazio', () => {
    expect(formatCalendarDate('')).toBe('N/A');
  });
});
