/* Modal primitives come from indas-ui. Re-exported here so pages import from
   one place and a future swap stays contained to this file. */
export {
  Modal, ModalPortal, ModalOverlay, ModalClose, ModalTrigger, ModalContent,
  ModalHeader, ModalFooter, ModalTitle, ModalDescription,
} from 'indas-ui'

export { StandardModal } from './standard-modal'
export { DetailModal } from './detail-modal'
export type { DetailModalProps } from './detail-modal'
export type { StandardModalProps, ModalSize } from './standard-modal'

export * from './create'
