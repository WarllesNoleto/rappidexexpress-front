import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DeliveryContext } from "../../context/DeliveryContext";
import api from "../../services/api";
import { 
    Filter,
    Container,
    Content,
    HeaderFilter,
    UsersContainer,
    UserContainer,
    Username,
    ContainerProfileImage,
    ProfileImage,
    ContainerLoading
} from "./styles";
import { Loader } from "../../components/Loader";
import { User } from "../../shared/interfaces";

export function Users(){
    const { token } = useContext(DeliveryContext)
    api.defaults.headers.Authorization = `Bearer ${token}`

    const navigate = useNavigate()
    const [type, setType] = useState('shopkeeper');
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<User[]>([])

    const getData = useCallback(async () => {
        try {
            const usersResponse = await api.get(`/user?type=${type}`)

            setUsers(usersResponse.data.data)
            setLoading(false)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar usuários.'
            alert(message)
        }
    }, [type])

    function handleMotoboys(){
        setLoading(true)
        setType('motoboy')
    }

    function handleShopkeeper(){
        setLoading(true)
        setType('shopkeeper')
    }

    function handleUser(user: string) {
        navigate(`/novo-usuario/${user}`)
    }

    useEffect(() => {
        getData()
    }, [getData])

    return (
        <Container>
            <Content>
                <HeaderFilter>
                    <Filter isSelected={type==='shopkeeper'} onClick={handleShopkeeper}>Lojistas</Filter>
                    <Filter isSelected={type==='motoboy'} onClick={handleMotoboys}>Motoboys</Filter>
                </HeaderFilter>

                <UsersContainer>
                    {loading ? 
                        <ContainerLoading>
                            <Loader size={40} biggestColor="green" smallestColor="gray" />
                        </ContainerLoading> : 
                        <>
                            {users.map((user: User) => 
                            <UserContainer onClick={() => handleUser(user.user)}>
                                <ContainerProfileImage>
                                    <ProfileImage src={user.profileImage}  />
                                </ContainerProfileImage>
                                <Username>{user.name}</Username>
                            </UserContainer>
                            )}
                        </>
                    }
                </UsersContainer>
            </Content>
        </Container>
    )
}