import { Modal, Typography, Box } from '@mui/material';
import { BaseButton, BaseInput } from './styles';
import { useState } from 'react';

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
}

export function BaseModal({isVisible, handleClose, onConfirmObservation}: ModalProps){
    const [observation, setModalObservation] = useState('')
    function handleNext() {
        onConfirmObservation(observation);
        setModalObservation('')
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
                    value={observation}
                    onChange={(event) => { setModalObservation(event.target.value) }}
                />
                <BaseButton onClick={handleNext}>Adicionar</BaseButton>
            </Box>
        </Modal>
    )
}
