/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { DeliveryContext } from '../../context/DeliveryContext'
import api from '../../services/api'
import { Loader } from '../../components/Loader'
import { City } from '../../shared/interfaces'
import {
  Container,
  Content,
  Header,
  Title,
  Description,
  CityForm,
  CityInput,
  CitySelect,
  CityTextarea,
  FormActions,
  SubmitButton,
  CancelButton,
  CitiesList,
  CityCard,
  CityInfo,
  CityName,
  CityState,
  CityMessage,
  CityCardActions,
  CityActionButton,
  EmptyState,
  LoaderContainer,
} from './styles'

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre (AC)' },
  { value: 'AL', label: 'Alagoas (AL)' },
  { value: 'AP', label: 'Amapá (AP)' },
  { value: 'AM', label: 'Amazonas (AM)' },
  { value: 'BA', label: 'Bahia (BA)' },
  { value: 'CE', label: 'Ceará (CE)' },
  { value: 'DF', label: 'Distrito Federal (DF)' },
  { value: 'ES', label: 'Espírito Santo (ES)' },
  { value: 'GO', label: 'Goiás (GO)' },
  { value: 'MA', label: 'Maranhão (MA)' },
  { value: 'MT', label: 'Mato Grosso (MT)' },
  { value: 'MS', label: 'Mato Grosso do Sul (MS)' },
  { value: 'MG', label: 'Minas Gerais (MG)' },
  { value: 'PA', label: 'Pará (PA)' },
  { value: 'PB', label: 'Paraíba (PB)' },
  { value: 'PR', label: 'Paraná (PR)' },
  { value: 'PE', label: 'Pernambuco (PE)' },
  { value: 'PI', label: 'Piauí (PI)' },
  { value: 'RJ', label: 'Rio de Janeiro (RJ)' },
  { value: 'RN', label: 'Rio Grande do Norte (RN)' },
  { value: 'RS', label: 'Rio Grande do Sul (RS)' },
  { value: 'RO', label: 'Rondônia (RO)' },
  { value: 'RR', label: 'Roraima (RR)' },
  { value: 'SC', label: 'Santa Catarina (SC)' },
  { value: 'SP', label: 'São Paulo (SP)' },
  { value: 'SE', label: 'Sergipe (SE)' },
  { value: 'TO', label: 'Tocantins (TO)' },
] as const

function getStateLabel(value?: string) {
  if (!value) {
    return 'Estado não informado'
  }
  const state = BRAZILIAN_STATES.find((item) => item.value === value)
  return state ? state.label : value
}

export function Cities() {
    const { token, permission } = useContext(DeliveryContext)
  api.defaults.headers.Authorization = `Bearer ${token}`

  const [cities, setCities] = useState<City[]>([])
  const [cityName, setCityName] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [cityWhatsappMessage, setCityWhatsappMessage] = useState('')
  const [editingCityId, setEditingCityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [updatingCityId, setUpdatingCityId] = useState<string | null>(null)

  async function fetchCities() {
    setLoading(true)
    try {
      const response = await api.get('/city')
      const rawData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : []
      setCities(rawData as City[])
    } catch (error: any) {
      alert(error.response?.data?.message ?? 'Não foi possível carregar as cidades.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCurrentUser() {
    setUserLoading(true)
    try {
      const response = await api.get('/user/myself')
      setCurrentUser(response.data)
      const userCityId =
        response.data?.cityId ??
        response.data?.city?.id ??
        response.data?.city?.cityId ??
        null
      setSelectedCityId(userCityId ? String(userCityId) : null)
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          'Não foi possível carregar os dados do usuário para vincular a cidade.',
      )
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    if (permission === 'superadmin') {
      fetchCities()
      fetchCurrentUser()
    } else {
      setLoading(false)
      setUserLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission])

    function resetForm() {
    setCityName('')
    setSelectedState('')
    setCityWhatsappMessage('')
    setEditingCityId(null)
  }

  function handleEditCity(city: City) {
    setCityName(city.name ?? '')
    setSelectedState(city.state ?? '')
    setCityWhatsappMessage(city.clientWhatsappMessage ?? '')
    setEditingCityId(city.id ? String(city.id) : null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleCreateCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const trimmedName = cityName.trim()
    if (!trimmedName) {
      alert('Informe o nome da cidade.')
      return
    }

    const payload = {
      name: trimmedName,
      state: selectedState,
      clientWhatsappMessage: cityWhatsappMessage.trim(),
    }

    setIsSubmitting(true)
    try {
      if (editingCityId) {
        await api.put(`/city/${editingCityId}`, payload)
        alert('Cidade atualizada com sucesso!')
      } else {
        await api.post('/city', payload)
        alert('Cidade cadastrada com sucesso!')
      }

      resetForm()
      await fetchCities()
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          'Não foi possível salvar a cidade.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSelectCity(city: City) {
    const cityId = city.id ? String(city.id) : null

    if (!cityId) {
      alert('Cidade selecionada não possui identificador válido para vincular ao usuário.')
      return
    }

    if (updatingCityId === cityId) {
      return
    }

    if (!currentUser?.id) {
      alert('Não foi possível identificar o usuário logado para atualizar a cidade.')
      return
    }

    setUpdatingCityId(cityId)

    try {
      const phoneOnlyDigits = (currentUser.phone ?? '').toString().replace(/\D/g, '')
      const payload = {
        name: currentUser.name ?? '',
        phone: phoneOnlyDigits,
        user: currentUser.user ?? '',
        pix: currentUser.pix ?? '',
        profileImage: currentUser.profileImage ?? '',
        location: currentUser.location ?? '',
        type: currentUser.type ?? '',
        cityId,
      }

      await api.put(`/user/${currentUser.id}`, payload)
      setSelectedCityId(cityId)
      setCurrentUser((prev: any) => (prev ? { ...prev, cityId } : prev))
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          'Não foi possível atualizar a cidade vinculada ao usuário.',
      )
    } finally {
      setUpdatingCityId(null)
    }
  }

  if (permission !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  return (
    <Container>
      <Content>
        <Header>
          <Title>Cidades</Title>
          <Description>Gerencie as cidades atendidas pela plataforma.</Description>
        </Header>

                <CityForm onSubmit={handleCreateCity}>
          <CityInput
            placeholder="Nome da cidade"
            value={cityName}
            onChange={(event) => setCityName(event.target.value)}
            disabled={isSubmitting}
          />

          <CitySelect
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Selecione o estado</option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </CitySelect>

          <CityTextarea
            placeholder="Mensagem personalizada que o motoboy vai mandar ao cliente dessa cidade"
            value={cityWhatsappMessage}
            onChange={(event) => setCityWhatsappMessage(event.target.value)}
            disabled={isSubmitting}
          />

          <FormActions>
            <SubmitButton
              type="submit"
              disabled={isSubmitting || !cityName.trim() || !selectedState}
            >
              {isSubmitting ? (
                <Loader size={24} biggestColor="gray" smallestColor="gray" />
              ) : editingCityId ? (
                'Salvar alterações'
              ) : (
                'Cadastrar cidade'
              )}
            </SubmitButton>

            {editingCityId && (
              <CancelButton type="button" onClick={resetForm} disabled={isSubmitting}>
                Cancelar edição
              </CancelButton>
            )}
          </FormActions>
        </CityForm>

        {loading || userLoading ? (
          <LoaderContainer>
            <Loader size={60} biggestColor="green" smallestColor="gray" />
          </LoaderContainer>
        ) : cities.length > 0 ? (
          <CitiesList>
            {cities.map((city) => {
              const cityId = city.id ? String(city.id) : ''
              const isSelected = Boolean(cityId) && selectedCityId === cityId
              const isUpdating = updatingCityId === cityId
              const isDisabled = userLoading || !cityId || Boolean(updatingCityId)

                            return (
                <CityCard
                  key={city.id ?? city.name}
                  $isSelected={isSelected}
                >
                  <CityInfo>
                    <CityName>{city.name}</CityName>
                    <CityState>{getStateLabel(city.state)}</CityState>
                    <CityMessage>
                      {city.clientWhatsappMessage?.trim()
                        ? city.clientWhatsappMessage
                        : 'Sem mensagem personalizada. Será usada a mensagem padrão do sistema.'}
                    </CityMessage>
                  </CityInfo>

                  <CityCardActions>
                    <CityActionButton
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      disabled={isDisabled}
                    >
                      {isUpdating ? (
                        <Loader size={20} biggestColor="gray" smallestColor="gray" />
                      ) : isSelected ? (
                        'Selecionada'
                      ) : (
                        'Selecionar'
                      )}
                    </CityActionButton>

                    <CityActionButton
                      type="button"
                      $variant="secondary"
                      onClick={() => handleEditCity(city)}
                      disabled={isSubmitting || Boolean(updatingCityId)}
                    >
                      Editar mensagem
                    </CityActionButton>
                  </CityCardActions>
                </CityCard>
              )
            })}
          </CitiesList>
        ) : (
          <EmptyState>Nenhuma cidade cadastrada até o momento.</EmptyState>
        )}
      </Content>
    </Container>
  )
}
