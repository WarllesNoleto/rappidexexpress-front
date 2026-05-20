import { produce } from 'immer'
import { ActionTypes } from './actions'

interface DeliveryState {
    token: string | null,
    permission: string | null
}

interface DeliveryAction {
    type: ActionTypes
    payload?: {
        token: string
        permission: string
    }
}

export function deliveryReducer(state: DeliveryState, action: DeliveryAction) {
    switch (action.type) {
        case ActionTypes.LOGIN: {
            if (!action.payload) {
                return state
            }
            const payload = action.payload
            return produce(state, (draft) => {
                draft.token = payload.token
                draft.permission = payload.permission
            })
        }
        case ActionTypes.LOGOUT:
            return produce(state, (draft) => {
                draft.token = null
                draft.permission = null
            })
        default:
            return state
    }
}