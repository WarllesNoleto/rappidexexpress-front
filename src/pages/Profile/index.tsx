/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { useForm } from 'react-hook-form'
import OneSignal from 'react-onesignal';

import { DeliveryContext } from '../../context/DeliveryContext';
import api from '../../services/api';

import { 
    BaseInput, 
    ChangePasswordButton, 
    Container, 
    ContainerButtons, 
    ContainerProfileImage, 
    FormContainer, 
    ProfileImage,
    NotificationButton,
} from "./styles";
import { Loader } from '../../components/Loader';

const ProfileFormValidationSchema = zod.object({
    name: zod.string().min(5, 'Informe o seu nome.'),
    phone: zod
      .string()
      .min(11, 'Informe o seu numero.')
      .max(11),
    pix: zod.string(),
    profileImage: zod.string(),
    location: zod.string()
})

type ProfileFormData = zod.infer<typeof ProfileFormValidationSchema>

const isOneSignalEnabled =
    import.meta.env.VITE_ENABLE_ONESIGNAL === 'true' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname)

export function Profile(){
    const { token, permission } = useContext(DeliveryContext)
    api.defaults.headers.Authorization = `Bearer ${token}`

    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [loadingNotification, setLoadingNotification] = useState(false)
    const [username, setUsername] = useState('')
    const [profileImage, setProfileImage] = useState('')
    const [cityDisplay, setCityDisplay] = useState('')
    const [formValues, setFormValues] = useState({
        name: '',
        phone: '',
        pix: '',
        profileImage: '',
        location: ''
    })
    const [cityId, setCityId] = useState('')

    const { register } = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileFormValidationSchema),
        values: formValues,
    })

    function handleConfig() {
        navigate('/configuracao')
    }

    function handleUsers() {
        navigate('/usuarios')
    }

    function changePassword() {
        navigate('/alterar-senha')
    }

    async function handleNotification() {
        if (loadingNotification) {
            return
        }

        if (!isOneSignalEnabled) {
            alert('As notificações estão desativadas no ambiente local.')
            return
        }

        setLoadingNotification(true)

        try {
            await OneSignal.Slidedown.promptPush()

            if (!OneSignal.User?.PushSubscription?.id) {
                throw new Error('Não foi possível obter o subscriptionId do OneSignal.')
            }

            await api.put(`/user/${username}/notification-config`, {
                notification: { subscriptionId: OneSignal.User.PushSubscription.id }
            })

            alert('As notificações foram ativadas!')
        } catch (error: any) {
            alert(error.response?.data?.message ?? error.message ?? 'Erro ao ativar notificações.')
        } finally {
            setLoadingNotification(false)
        }
    }

    async function getMyData(){
        try {
            const response = await api.get('/user/myself')

            setFormValues({
                name: response.data.name,
                phone: response.data.phone,
                pix: response.data.pix,
                profileImage: response.data.profileImage,
                location: response.data.location,
            })

            setUsername(response.data.user)
            setProfileImage(response.data.profileImage)

            const userCityId = response.data?.cityId
                ?? response.data?.city?.id
                ?? response.data?.city?.cityId
                ?? ''

            const normalizedCityId = userCityId ? String(userCityId) : ''
            setCityId(normalizedCityId)

            const userCityName = response.data?.city?.name ?? response.data?.cityName ?? ''
            const userCityState = response.data?.city?.state ?? response.data?.cityState ?? ''
            const formattedCity = userCityName
                ? userCityState ? `${userCityName} - ${userCityState}` : userCityName
                : ''

            setCityDisplay(formattedCity)
        } catch (error: any) {
            alert(error.response?.data?.message ?? 'Erro ao carregar os dados do perfil.')
        } finally {
            setLoading(false)
        }
    }

    async function resolveCityDisplay(cityIdValue: string) {
        if (!cityIdValue || cityDisplay) {
            return
        }

        try {
            const response = await api.get('/city')
            const citiesData = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data)
                ? response.data
                : []

            const matchedCity = citiesData.find((city: any) => String(city.id) === cityIdValue)

            if (matchedCity) {
                const cityState = matchedCity.state ? ` - ${matchedCity.state}` : ''
                setCityDisplay(`${matchedCity.name}${cityState}`)
            }
        } catch (error: any) {
            alert(error.response?.data?.message ?? 'Não foi possível carregar a cidade vinculada.')
        }
    }

    useEffect(() => {
        getMyData()
    }, [])

    useEffect(() => {
        if (!cityDisplay && cityId) {
            resolveCityDisplay(cityId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cityDisplay, cityId])

    return (
        <Container>
            {loading ?
                <Loader size={70} biggestColor='green' smallestColor='gray' /> :
                <>
                    <ContainerProfileImage>
                        <ProfileImage src={profileImage} />
                    </ContainerProfileImage>

                    <FormContainer>
                        <label htmlFor="name">Nome:</label>
                        <BaseInput
                            type="text"
                            id="name"
                            placeholder="Informe o seu nome."
                            disabled
                            {...register('name')}
                        />

                        <label htmlFor="phone">Whatsapp:</label>
                        <BaseInput
                            type="text"
                            id="phone"
                            minLength={11}
                            maxLength={11}
                            placeholder="Informe o seu whatsapp."
                            disabled
                            {...register('phone')}
                        />

                        <label htmlFor="pix">Pix:</label>
                        <BaseInput
                            type="text"
                            id="pix"
                            placeholder="Informe o seu pix."
                            disabled
                            {...register('pix')}
                        />

                        <label htmlFor="profileImage">Link da imagem de perfil:</label>
                        <BaseInput
                            type="text"
                            id="profileImage"
                            placeholder="Informe o link da sua imagem."
                            disabled
                            {...register('profileImage')}
                        />

                        <label htmlFor="location">Link do google maps:</label>
                        <BaseInput
                            type="text"
                            id="location"
                            placeholder="Informe o link da localização."
                            disabled
                            {...register('location')}
                        />

                        <label htmlFor="city">Cidade:</label>
                        <BaseInput
                            id="city"
                            type="text"
                            value={cityDisplay}
                            placeholder="Cidade não vinculada"
                            readOnly
                            disabled
                        />

                        <ContainerButtons>
                            <NotificationButton
                                type="button"
                                onClick={handleNotification}
                                backgroundColor={'green-500'}
                            >
                                {loadingNotification ?
                                    <Loader size={20} biggestColor='gray' smallestColor='gray' /> :
                                    'Ativar Notificações'
                                }
                            </NotificationButton>

                            {(permission === 'admin' || permission === 'superadmin') &&
                                <>
                                    <NotificationButton
                                        type="button"
                                        onClick={handleConfig}
                                        backgroundColor={'gray-400'}
                                    >
                                        Configurações
                                    </NotificationButton>

                                    <NotificationButton
                                        type="button"
                                        onClick={handleUsers}
                                        backgroundColor={'gray-400'}
                                    >
                                        Usuários
                                    </NotificationButton>
                                </>
                            }

                            <ChangePasswordButton type="button" onClick={changePassword}>
                                Trocar de senha
                            </ChangePasswordButton>
                        </ContainerButtons>
                    </FormContainer>
                </>
            }
        </Container>
    )
}
