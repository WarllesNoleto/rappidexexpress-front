export function translateIfoodOperationType(operationType?: string) {
  switch (operationType) {
    case 'ADD':
      return 'Adição';
    case 'REMOVE':
      return 'Remoção';
    case 'CONSUME':
      return 'Consumo';
    case 'REFUND':
      return 'Estorno';
    default:
      return operationType || '-';
  }
}

export function formatIfoodHistoryDateTime(dateValue?: string) {
  if (!dateValue) {
    return { date: '-', time: '-' };
  }

  const normalizedValue = dateValue.trim();
  const isoMatch = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (isoMatch) {
    const [, year, month, day, hours, minutes, seconds = '00'] = isoMatch;

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return { date: '-', time: '-' };
  }

  return {
    date: parsedDate.toLocaleDateString('pt-BR'),
    time: parsedDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}