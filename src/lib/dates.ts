// Datas de venda são dias de calendário gravados à meia-noite UTC (spec crm-vendas-por-mes).
// Mês e dia vêm sempre dos dígitos / de Data.UTC(), nunca do instante convertido para o fuso local.

const pad2 = (n: number) => String(n).padStart(2, '0');

// Limites do mês (dia de calendário UTC) usados para pedir a coluna Ganho.
export const ganhoRange = (year: number, monthIndex: number) => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return {
    start: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)).toISOString(),
    end: new Date(Date.UTC(year, monthIndex, lastDay, 23, 59, 59, 999)).toISOString(),
  };
};

// Dia de hoje no calendário local do navegador (YYYY-MM-DD), e não o dia UTC.
export const todayLocalISODate = (now: Date = new Date()) =>
  `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

// Formata YYYY-MM-DD ou YYYY-MM-DDT... como DD/MM/YYYY a partir dos próprios dígitos.
export const formatCalendarDate = (value?: string | null) => {
  const match = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (!match) return 'N/A';
  return `${match[3]}/${match[2]}/${match[1]}`;
};
