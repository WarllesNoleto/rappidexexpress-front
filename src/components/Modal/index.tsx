import { Modal, Typography, Box } from '@mui/material';
import { BaseButton, BaseInput } from './styles';
import { useEffect, useState } from 'react';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  background: '#202024'
};

export interface ModalProps {
    isVisible: boolean
    handleClose: () => void
    onConfirmObservation: (text: string) => void
    observation: string
    onObservationChange: (value: string) => void
    isLoading?: boolean
}

export function BaseModal({
    isVisible,
    handleClose,
    onConfirmObservation,
    observation,
    onObservationChange,
    isLoading = false,
}: ModalProps){
    const [localObservation, setLocalObservation] = useState(observation)

    useEffect(() => {
        setLocalObservation(observation)
    }, [observation, isVisible])

    useEffect(() => {
        onObservationChange(localObservation)
    }, [localObservation, onObservationChange])

    function handleNext() {
        if (isLoading) return;
        onConfirmObservation(localObservation);
    }

    return (
        <Modal 
            open={isVisible}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Observação
                </Typography>
                <BaseInput
                    type="text"
                    id="user"
                    placeholder="Opcional"
                    value={localObservation}
                    onChange={(event) => { setLocalObservation(event.target.value) }}
                />
                <BaseButton onClick={handleNext} disabled={isLoading}>
                    {isLoading ? "Adicionando..." : "Adicionar"}
                </BaseButton>
            </Box>
        </Modal>
    )
}
