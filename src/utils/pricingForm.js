// Conversão entre a regra da API (números) e o formulário (textos digitados).
// A API valida tudo de novo; aqui só evitamos enviar texto que não é número.

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const str = (v) => (v == null ? '' : String(v));
export const toNumber = (text) => {
  const t = String(text ?? '').trim().replace(',', '.');
  if (t === '') return NaN;
  return Number(t);
};

export function ruleToForm(rule) {
  return {
    baseFee: str(rule.baseFee),
    perKm: str(rule.perKm),
    minimumFee: str(rule.minimumFee),
    maximumFee: str(rule.maximumFee),
    rounding: rule.rounding ?? 'integer',
    longDistanceFromKm: str(rule.longDistanceFromKm),
    longDistanceBlockKm: str(rule.longDistanceBlockKm),
    longDistanceExtra: str(rule.longDistanceExtra),
    rainActive: !!rule.rain?.active,
    rainKind: rule.rain?.kind ?? 'percent',
    rainValue: str(rule.rain?.value),
    adjustments: (rule.adjustments ?? []).map((a) => ({
      name: a.name, kind: a.kind, value: str(a.value), from: a.from, to: a.to, days: [...(a.days ?? [])], active: a.active !== false,
    })),
  };
}

export function newAdjustment() {
  return { name: '', kind: 'percent', value: '', from: '18:00', to: '23:00', days: [], active: true };
}

const NUMBER_FIELDS = [
  ['baseFee', 'Valor base'],
  ['perKm', 'Preço por km'],
  ['minimumFee', 'Valor mínimo'],
  ['longDistanceFromKm', 'Km do adicional de distância longa'],
  ['longDistanceBlockKm', 'Bloco de km'],
  ['longDistanceExtra', 'Adicional por bloco'],
];

/** { payload } quando os números são válidos, ou { errors } com uma mensagem por campo. */
export function formToPayload(form) {
  const errors = {};
  const payload = { rounding: form.rounding };

  for (const [field, label] of NUMBER_FIELDS) {
    const n = toNumber(form[field]);
    if (!Number.isFinite(n) || n < 0) errors[field] = `${label}: informe um número maior ou igual a 0`;
    else payload[field] = n;
  }

  if (String(form.maximumFee).trim() === '') payload.maximumFee = null;
  else {
    const n = toNumber(form.maximumFee);
    if (!Number.isFinite(n) || n < 0) errors.maximumFee = 'Teto: informe um número maior ou igual a 0, ou deixe em branco';
    else payload.maximumFee = n;
  }

  const rainValue = String(form.rainValue).trim() === '' ? 0 : toNumber(form.rainValue);
  if (!Number.isFinite(rainValue) || rainValue < 0) errors.rainValue = 'Adicional de chuva: informe um número maior ou igual a 0';
  else if (form.rainActive && rainValue <= 0) errors.rainValue = 'Para ligar o modo chuva, informe o valor do adicional';
  payload.rain = { active: !!form.rainActive, kind: form.rainKind, value: Number.isFinite(rainValue) ? rainValue : 0 };

  payload.adjustments = form.adjustments.map((a, i) => {
    const value = toNumber(a.value);
    if (!Number.isFinite(value) || value <= 0) errors[`adjustments.${i}.value`] = 'Informe o valor do adicional (maior que 0)';
    if (!a.name.trim()) errors[`adjustments.${i}.name`] = 'Dê um nome à faixa';
    if (!a.from || !a.to || a.from === a.to) errors[`adjustments.${i}.to`] = 'Horário final deve ser diferente do inicial';
    return { name: a.name.trim(), kind: a.kind, value, from: a.from, to: a.to, days: a.days, active: a.active };
  });

  return Object.keys(errors).length ? { errors } : { payload };
}

/** Resumo curto de uma regra para a lista de cidades. */
export function summarizeRule(rule) {
  const fmt = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `R$ ${fmt(rule.baseFee)} + R$ ${fmt(rule.perKm)}/km · mínimo R$ ${fmt(rule.minimumFee)}`;
}
