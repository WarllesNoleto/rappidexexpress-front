import styled from 'styled-components'

export const Container = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
`

export const Content = styled.div`
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.white};
`

export const Description = styled.p`
  color: ${(props) => props.theme['gray-400']};
`

export const CityForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 520px) {
    flex-direction: row;
  }
`

export const CityInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 0;
  background: ${(props) => props.theme['gray-600']};
  color: ${(props) => props.theme['gray-100']};

  &::placeholder {
    color: ${(props) => props.theme['gray-400']};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const CitySelect = styled.select`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 0;
  background: ${(props) => props.theme['gray-600']};
  color: ${(props) => props.theme['gray-100']};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 0;
  background: ${(props) => props.theme['green-500']};
  color: ${(props) => props.theme.white};
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(1.1);
  }

  @media (min-width: 520px) {
    width: auto;
  }
`

export const CitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

interface CityCardProps {
  $isSelected?: boolean
}

export const CityCard = styled.button<CityCardProps>`
  padding: 1rem;
  border-radius: 8px;
  background: ${(props) => props.theme['gray-600']};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  border: 2px solid
    ${(props) => (props.$isSelected ? props.theme['green-500'] : 'transparent')};
  cursor: pointer;
  color: ${(props) => props.theme['gray-100']};
  appearance: none;
  transition: border-color 0.2s ease, transform 0.1s ease;

  &:hover {
    border-color: ${(props) => props.theme['green-500']};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme['green-500']};
  }
`

export const CityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`

export const CityName = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme['gray-100']};
`

export const CityState = styled.span`
  font-size: 0.875rem;
  color: ${(props) => props.theme['gray-300']};
`

export const SelectionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const EmptyState = styled.p`
  text-align: center;
  color: ${(props) => props.theme['gray-400']};
`

export const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
`
