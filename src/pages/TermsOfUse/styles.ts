import styled from 'styled-components'

export const Container = styled.main`
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  background: ${(props) => props.theme['gray-900']};
`

export const Content = styled.section`
  width: min(960px, 100%);
  background: ${(props) => props.theme['gray-800']};
  border: 1px solid ${(props) => props.theme['gray-600']};
  border-radius: 12px;
  padding: 1.5rem;
  color: ${(props) => props.theme['gray-100']};

  h1 {
    color: ${(props) => props.theme['green-300']};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 1.25rem 0 0.5rem;
    font-size: 1.1rem;
    color: ${(props) => props.theme.white};
  }

  a {
    color: ${(props) => props.theme['green-300']};
  }

  @media (max-width: 768px) {
    padding: 1rem;

    h1 {
      font-size: 1.25rem;
    }
  }
`