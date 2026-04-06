export enum messageTypes {
  motoboy = 'motoboy',
  client = 'client',
  establishment = 'establishment',
}

const defaultMessages = {
  [messageTypes.motoboy]: 'Olá, tudo bem? Aqui é do Rappidex.',
  [messageTypes.client]:
    'Olá, tudo bem? Sou o entregador do Rappidex, preciso da sua localização para fazer a entrega do seu pedido!',
  [messageTypes.establishment]:
    'Olá, tudo bem? Está tudo certo com o pedido do meu estabelecimento?',
}

const apiWhatsapp = 'https://wa.me'

function sanitizePhone(phone: string) {
  return String(phone ?? '').replace(/\D/g, '')
}

function getWhatsappMessage(type: messageTypes, customMessage?: string) {
  const message =
    customMessage && customMessage.trim().length > 0
      ? customMessage.trim()
      : defaultMessages[type]

  return encodeURIComponent(message)
}

export const getLinkToWhatsapp = (
  phone: string,
  type: messageTypes,
  customMessage?: string,
) => `${apiWhatsapp}/55${sanitizePhone(phone)}?text=${getWhatsappMessage(type, customMessage)}`