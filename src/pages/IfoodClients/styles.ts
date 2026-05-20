import styled from 'styled-components';

export const Container = styled.main`
  flex: 1;
  width: 100%;
  display: grid;
  align-items: start;
  justify-content: center;
  margin-top: 2rem;
`;

export const Content = styled.div`
  width: min(52rem, 95vw);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Title = styled.h1`
  font-size: 1.5rem;
`;

export const Subtitle = styled.p`
  color: ${(props) => props.theme['gray-300']};
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
`;

export const Card = styled.div`
  background: ${(props) => props.theme['gray-600']};
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ShopkeeperName = styled.strong`
  font-size: 1.1rem;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
`;

export const MerchantIdLabel = styled.label`
  display: block;
  margin-bottom: 0.25rem;
`;

export const Input = styled.input`
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 0.75rem;
`;

export const SaveButton = styled.button`
  width: fit-content;
  border: 0;
  border-radius: 8px;
  background: ${(props) => props.theme['green-700']};
  color: ${(props) => props.theme['gray-100']};
  font-weight: 700;
  padding: 0.75rem 1rem;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.8;
  }
`;

export const CreditSummary = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const CreditLine = styled.span`
  background: ${(props) => props.theme['gray-700']};
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
`;

export const CreditButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const CreditInput = styled.input`
  max-width: 9rem;
  border: 0;
  border-radius: 8px;
  padding: 0.65rem;
`;

export const CreditButton = styled.button`
  border: 0;
  border-radius: 8px;
  background: ${(props) => props.theme['green-700']};
  color: ${(props) => props.theme['gray-100']};
  font-weight: 600;
  padding: 0.65rem 0.8rem;
  cursor: pointer;
`;

export const HistoryButton = styled.button`
  border: 0;
  border-radius: 8px;
  background: ${(props) => props.theme['gray-500']};
  color: ${(props) => props.theme['gray-100']};
  font-weight: 600;
  padding: 0.65rem 0.8rem;
  cursor: pointer;
`;

export const HistoryList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const HistoryItem = styled.li`
  color: ${(props) => props.theme['gray-200']};
  font-size: 0.85rem;
`;