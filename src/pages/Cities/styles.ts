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
`

export const CityInput = styled.input`
  width: 100%;
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
  width: 100%;
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

export const CityTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 0;
  resize: vertical;
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

export const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`

export const SubmitButton = styled.button`
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
`

export const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 0;
  background: ${(props) => props.theme['gray-500']};
  color: ${(props) => props.theme.white};
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(1.1);
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

export const CityCard = styled.div<CityCardProps>`
  padding: 1rem;
  border-radius: 8px;
  background: ${(props) => props.theme['gray-600']};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  border: 2px solid
    ${(props) => (props.$isSelected ? props.theme['green-500'] : 'transparent')};
`

export const CityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

export const CityName = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme['gray-100']};
`

export const CityState = styled.span`
  font-size: 0.875rem;
  color: ${(props) => props.theme['gray-300']};
`

export const CityMessage = styled.p`
  font-size: 0.9rem;
  line-height: 1.4;
  color: ${(props) => props.theme['gray-200']};
  white-space: pre-wrap;
`

export const CityCardActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`

interface CityActionButtonProps {
  $variant?: 'primary' | 'secondary'
}

export const CityActionButton = styled.button<CityActionButtonProps>`
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  font-weight: 700;
  transition: filter 0.2s;
  background: ${(props) =>
    props.$variant === 'secondary'
      ? props.theme['gray-500']
      : props.theme['green-500']};
  color: ${(props) => props.theme.white};
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