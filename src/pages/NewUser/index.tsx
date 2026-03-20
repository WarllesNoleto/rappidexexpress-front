/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import * as zod from 'zod'
import { useForm } from 'react-hook-form'

import { DeliveryContext } from '../../context/DeliveryContext';
import api from '../../services/api';
import { City } from '../../shared/interfaces';
import { 
    BaseInput,
    Container,
    ContainerButtons,
    FormContainer,
    BaseButton,
    BaseInputMask,
    DeleteButton,
    ResetPassButton,
} from "./styles";
import { Loader } from '../../components/Loader';

const ProfileFormValidationSchema = zod.object({
    name: zod.string().min(5, 'Informe o seu nome.'),
    phone: zod.string(),
    user: zod.string(),
    password: zod.string(),
    pix: zod.string(),
    profileImage: zod.string(),
    location: zod.string()
  })

  
type ProfileFormData = zod.infer<typeof ProfileFormValidationSchema>

export function NewUser(){
    const { token, permission } = useContext(DeliveryContext)
    api.defaults.headers.Authorization = `Bearer ${token}`
    const navigate = useNavigate()

    const { user } = useParams();

    const [userId, setUserId] = useState()
    const [formValues, setFormValues] = useState({
        name: '',
        phone: '',
        user: '',
        password: '',
        pix: '',
        profileImage: '',
        location: '',
    })

    const [loading, setLoading] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingResetPass, setLoadingResetPass] = useState(false)
    const [selectedType, setSelectedType] = useState('')
    const [cities, setCities] = useState<City[]>([])
    const [citiesLoading, setCitiesLoading] = useState(false)
    const [selectedCityId, setSelectedCityId] = useState('')
    const [loggedUserCityId, setLoggedUserCityId] = useState('')
    const profileFormData = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileFormValidationSchema),
        values: formValues,
    })

    const { handleSubmit, watch, register, reset } = profileFormData

    const allowCitySelection = permission === 'superadmin'

    async function handleCreate(data: ProfileFormData) {
        if(loading){
            return
        }

        setLoading(true)

        if(data.phone.includes('_')){
            alert("Numero de telefone está faltando algum digito!")
            setLoading(false)
            return
        }

        const cityIdToSubmit = allowCitySelection ? selectedCityId : loggedUserCityId

        if (!cityIdToSubmit) {
            alert('Não foi possível identificar a cidade para vincular ao usuário.')
            setLoading(false)
            return
        }

        try {
            await api.post('/user', {
                ...data,
                phone: formatPhone(data.phone),
                type: selectedType,
                permission: (selectedType === 'admin'|| selectedType === 'superadmin') ? selectedType : 'none',
                cityId: cityIdToSubmit,
            })
            reset()
            setLoading(false)
            alert("Novo usuário criado com sucesso!")
        } catch (error: any) {
            setLoading(false)
            alert(error.response.data.message)
        }
    }

    async function handleSave(){
        if(loading){
            return
        }

        setLoading(true)

        const { name, phone, user, pix, profileImage, location } = watch();
        const cityIdToSubmit = allowCitySelection ? selectedCityId : loggedUserCityId

        if (!cityIdToSubmit) {
            alert('Não foi possível identificar a cidade para vincular ao usuário.')
            setLoading(false)
            return
        }
        try {
            await api.put(`/user/${userId}`, {
                name,
                phone: formatPhone(phone),
                user,
                pix,
                profileImage,
                location,
                type: selectedType,
                cityId: cityIdToSubmit,
            })
            setLoading(false)
            alert("Usuário editado com sucesso!")
        } catch (error: any) {
            setLoading(false)
            alert(error.response.data.message)
        }
    }

    async function handleDelete(){
        if(loadingDelete){
            return
        }

        setLoadingDelete(true)

        try {
            await api.delete(`/user/${userId}`)
            setLoadingDelete(false)
            alert("Usuário apagado com sucesso!")
            navigate('/')
        } catch (error: any) {
            setLoading(false)
            alert(error.response.data.message)
        }
    }

    async function handleReset(){
        if(loadingResetPass){
            return
        }

        setLoadingResetPass(true)

        try {
            await api.put(`/user/${userId}/reset-password`)
            setLoadingResetPass(false)
            alert("Senha resetada com sucesso!")
        } catch (error: any) {
            setLoading(false)
            alert(error.response.data.message)
        }
    }

    function formatPhone(phone: string){
        return phone.replace('(', '').replace(')', '').replace(' ', '').replace('-', '')
    }

    async function fetchCities() {
        if (!allowCitySelection) {
            setCities([])
            return
        }

        setCitiesLoading(true)
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
            setCitiesLoading(false)
        }
    }

    async function fetchLoggedUserCity() {
        try {
            const response = await api.get('/user/myself')
            const userCityId = response.data?.cityId
                ?? response.data?.city?.id
                ?? response.data?.city?.cityId
                ?? ''
            const normalizedCityId = userCityId ? String(userCityId) : ''
            setLoggedUserCityId(normalizedCityId)

            if (!allowCitySelection) {
                setSelectedCityId(normalizedCityId)
            }
        } catch (error: any) {
            alert(error.response?.data?.message ?? 'Não foi possível carregar a cidade do usuário logado.')
        }
    }

    async function getUserData(){
        let userFinded;
        try {
            userFinded = await api.get(`/user/${user}`)
            setFormValues(userFinded.data)
            setUserId(userFinded.data.id)
            setSelectedType(userFinded.data.type)
            const cityIdFromUser = userFinded.data?.cityId
                ?? userFinded.data?.city?.id
                ?? userFinded.data?.city?.cityId
                ?? ''
            const normalizedCityIdFromUser = cityIdFromUser ? String(cityIdFromUser) : ''

            if (allowCitySelection) {
                setSelectedCityId(normalizedCityIdFromUser)
            }
        } catch (error: any) {
            setLoading(false)
            alert(error.response.data.message)
        }
    }

    const name = watch('name')
    const phone = watch('phone')
    const pix = watch('pix')
    const profileImage = watch('profileImage')
    // const location = watch('location')
    const citySelectionMissing = allowCitySelection ? !selectedCityId : !loggedUserCityId
    const isSubmitDisabled = !name || !phone || !pix || !profileImage || phone.includes('_') || citySelectionMissing

    useEffect(() => {
        fetchLoggedUserCity()
        if (allowCitySelection) {
            fetchCities()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowCitySelection])

    useEffect(() => {
        if (user) {
            getUserData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    return (
        <Container>
            <form onSubmit={handleSubmit(handleCreate)} action="">

                <FormContainer>
                    
                    <label htmlFor="name">Nome:</label>
                    <BaseInput
                        type="text"
                        id="name"
                        placeholder="Informe o nome."
                        {...register('name')}
                    />

                    <label htmlFor="phone">Whatsapp:</label>
                    <BaseInputMask
                        type="text"
                        mask='(99) 99999-9999' 
                        id="phone"
                        placeholder="Informe o whatsapp."
                        {...register('phone')}
                    />

                    <label htmlFor="user">User:</label>
                    <BaseInput
                        type="text"
                        id="user"
                        placeholder="Informe o usuário."
                        {...register('user')}
                    />

                    {!user && 
                        <>
                            <label htmlFor="password">Senha:</label>
                            <BaseInput
                                type="password"
                                id="password"
                                placeholder="Informe a senha."
                                {...register('password')}
                            />
                        </>
                    }

                    <label htmlFor="pix">Pix:</label>
                    <BaseInput
                        type="text"
                        id="pix"
                        placeholder="Informe o pix."
                        {...register('pix')}
                    />

                    <label htmlFor="profileImage">Link da imagem de perfil:</label>
                    <BaseInput
                        type="text"
                        id="profileImage"
                        placeholder="Informe o link da imagem."
                        {...register('profileImage')}
                    />

                    <label htmlFor="location">Link do google maps:</label>
                    <BaseInput
                        type="text"
                        id="location"
                        placeholder="Informe o link da localização."
                        {...register('location')}
                    />

                    {allowCitySelection && (
                        <>
                            <label htmlFor="cityId">Cidade:</label>
                            <select
                                id="cityId"
                                value={selectedCityId}
                                onChange={(event) => setSelectedCityId(event.target.value)}
                                disabled={citiesLoading}
                            >
                                <option value="">Selecione a cidade</option>
                                {cities.map((city) => (
                                    <option key={city.id ?? city.name} value={city.id ?? ''}>
                                        {city.state ? `${city.name} - ${city.state}` : city.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <label htmlFor="userType">Tipo de usuário:</label>
                    <select 
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                    >
                        <option value="">Selecione uma opção:</option>
                        <option value="shopkeeper">Lojista</option>
                        <option value="shopkeeperadmin">Lojista Admin</option>
                        <option value="motoboy">Motoboy</option>
                        <option value="admin">Admin</option>
                    </select>   

                    {!user &&
                        <ContainerButtons>
                            <BaseButton disabled={isSubmitDisabled} type="submit">
                                {loading ?
                                    <Loader size={20} biggestColor='gray' smallestColor='gray' /> :
                                    "Criar novo usuário"
                                }
                            </BaseButton>
                        </ContainerButtons>
                    }
                </FormContainer>
            </form>
            {user && 
                <>
                    {user && 
                        <BaseButton disabled={isSubmitDisabled} onClick={handleSave}>
                            {loading ?
                                <Loader size={20} biggestColor='gray' smallestColor='gray' /> :
                                "Salvar"
                            }
                        </BaseButton>
                    }
                    
                    <ResetPassButton onClick={handleReset}>
                        {loadingResetPass ?
                            <Loader size={20} biggestColor='black' smallestColor='black' /> :
                            "Resetar Senha"
                        }
                    </ResetPassButton>

                    <DeleteButton onClick={handleDelete}>
                        {loadingDelete ?
                            <Loader size={20} biggestColor='gray' smallestColor='gray' /> :
                            "Apagar usuário"
                        }
                    </DeleteButton>
                </>
            }
        </Container>
    )
}
