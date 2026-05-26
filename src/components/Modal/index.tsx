import { Modal, Typography, Box } from '@mui/material';
import { BaseButton, BaseInput } from './styles';

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
    observation: string
    isSaving?: boolean
    onObservationChange: (text: string) => void
    onConfirmObservation: () => void
}

export function BaseModal({isVisible, handleClose, observation, isSaving = false, onObservationChange, onConfirmObservation}: ModalProps){

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
                    onChange={(event) => { onObservationChange(event.target.value) }}
                />
                <BaseButton onClick={onConfirmObservation} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Adicionar'}
                </BaseButton>
            </Box>
        </Modal>
    )
}
