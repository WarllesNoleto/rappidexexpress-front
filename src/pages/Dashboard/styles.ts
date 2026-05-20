import styled from 'styled-components'
import { StatusDelivery } from '../../shared/constants/enums.constants';

export const Container = styled.main`
  flex: 1;
  width: 100%;
  display: grid;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding: 0 1rem 2rem;

  @media (max-width: 768px) {
    padding: 0 0.75rem 1.5rem;
    margin-top: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.5rem 1rem;
  }
`;

export const ContainerButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const ShopkeeperCreditsContainer = styled.div`
  width: min(100%, 1200px);
  background: ${(props) => props.theme['gray-700']};
  border-radius: 1rem;
  padding: 1rem;
  margin: 0.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ShopkeeperCreditsHistory = styled.div`
  max-height: 12rem;
  overflow-y: auto;
  border-top: 1px solid ${(props) => props.theme['gray-500']};
  padding-top: 0.5rem;
  font-size: 0.875rem;
`;

export const ShopkeeperCreditsHistoryItem = styled.div`
  padding: 0.4rem 0;
  border-bottom: 1px solid ${(props) => props.theme['gray-600']};
`;

export const ShopkeeperCreditsToggleButton = styled.button`
  background: ${(props) => props.theme['gray-500']};
  color: ${(props) => props.theme['gray-100']};
  border: 0;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.75rem 1rem;
  width: fit-content;
  cursor: pointer;
  transition: filter 0.2s ease;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(1.1);
  }
`;

interface ButtonProps {
  typeReport: boolean
}

export const BaseButton = styled.div<ButtonProps>`
  background: ${(props) =>
    props.typeReport ? props.theme['gray-600'] : props.theme['gray-800']};

  border: solid;
  padding: 1rem;
  border-radius: 1rem 1rem 0rem 0rem;
  border-color: ${(props) => props.theme['gray-600']};

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;
  color: ${(props) =>
    props.typeReport ? props.theme['gray-300'] : props.theme['gray-500']};

  cursor: pointer;

  @media (max-width: 480px) {
    padding: 0.85rem;
    font-size: 0.95rem;
  }
`;

export const ContainerDeliveries = styled.div`
  background: ${(props) => props.theme['gray-600']};
  width: min(100%, 1200px);
  border-radius: 1rem;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    width: min(100%, 950px);
  }

  @media (max-width: 768px) {
    width: 100%;
    border-radius: 0.875rem;
  }

  @media (max-width: 480px) {
    border-radius: 0.75rem;
  }
`;

interface DeliveryProps {
  isfree: boolean
  isIfood?: boolean
}

export const Delivery = styled.div<DeliveryProps>`
  background-color: ${(props) =>
    props.isfree ? props.theme['green-700'] : props.theme['gray-700']};
  padding: 1rem;
  margin: 0.5rem auto;
  border-radius: 10px;
  box-sizing: border-box;
  width: calc(100% - 1rem);
  max-width: ${(props) => (props.isIfood ? '860px' : 'calc(100% - 1rem)')};
  overflow: hidden;

  @media (max-width: 1024px) {
    max-width: ${(props) => (props.isIfood ? '780px' : 'calc(100% - 1rem)')};
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    margin: 0.4rem auto;
    width: calc(100% - 0.8rem);
    max-width: calc(100% - 0.8rem);
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    margin: 0.3rem auto;
    border-radius: 8px;
    width: calc(100% - 0.6rem);
    max-width: calc(100% - 0.6rem);
  }
`;

export const Link = styled.a`
  display: flex;
  gap: 0.2rem;
  text-decoration: none;
  color: ${(props) => props.theme['gray-300']};
  font-weight: bold;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
`;

export const ContainerShopkeeper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

export const ShopkeeperProfileImage = styled.img`
  height: 6rem;
  width: 6rem;
  border-radius: 100%;
  object-fit: cover;
  flex-shrink: 0;

  @media (max-width: 480px) {
    height: 4.5rem;
    width: 4.5rem;
  }
`;

export const ContainerImagem = styled.div`
  height: 6rem;
  width: 6rem;
  border-radius: 100%;
  border: solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    height: 4.5rem;
    width: 4.5rem;
  }
`;

export const ShopkeeperInfo = styled.div`
  min-width: 0;
  flex: 1;
  max-width: 100%;

  p,
  span,
  a {
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }
`;

export const ContainerOrder = styled.div`
  margin: 1rem;
  max-width: 100%;
  min-width: 0;

  @media (max-width: 480px) {
    margin: 0.75rem;
  }
`;

export const ContainerInfo = styled.div`
  margin: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 100%;
  min-width: 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 100%;
    min-width: 0;
  }

  p {
    margin: 0;
    max-width: 100%;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  div p:first-child {
    font-weight: bold;
    color: ${(props) => props.theme['gray-100']};
  }

  a {
    width: fit-content;
    max-width: 100%;
    margin-top: 0.15rem;
  }

  @media (max-width: 480px) {
    margin: 0.75rem;
  }
`;

export const OrderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

interface OrderProps {
  typebutton: boolean
}

export const OrderButton = styled.div<OrderProps>`
  background: ${(props) =>
    props.typebutton ? props.theme['green-500'] : props.theme['red-700']};
  border: none;
  border-radius: 10%;
  margin-top: 1rem;
  padding: 1rem;

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;
  color: ${(props) => props.theme['gray-300']};

  cursor: pointer;

  @media (max-width: 480px) {
    padding: 0.85rem;
    min-width: 110px;
  }
`;

export const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0.25rem;
  margin: 1rem;
  max-width: 100%;
  min-width: 0;

  select,
  input {
    height: 2.5rem;
    background: ${(props) => props.theme['gray-600']};
    color: ${(props) => props.theme['gray-100']};
    width: 100%;
    max-width: 100%;
    min-width: 0;
    white-space: normal;
    border: 1px solid ${(props) => props.theme['gray-500']};
    border-radius: 0.4rem;
    padding: 0 0.75rem;
  }

  @media (max-width: 480px) {
    margin: 0.75rem;

    select,
    input {
      height: 2.3rem;
      font-size: 0.95rem;
    }
  }
`;

export const ContainerLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContainerStatus = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

interface StatusProps {
  type: string
}

export const Status = styled.p<StatusProps>`
  background-color: ${(props) =>
    props.type === StatusDelivery.ONCOURSE ? 'blue' : 'green'};
`;

export const Flag = styled.p`
  background-color: ${(props) => props.theme['green-700']};
  width: 15px;
  text-align: center;
`;