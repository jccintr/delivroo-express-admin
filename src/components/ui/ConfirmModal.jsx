import { Button, Modal, ModalBody, ModalHeader } from 'flowbite-react';

// Modal de confirmação genérico, reaproveitado nas ações que mudam o
// estado de uma conta (aprovar, ativar, desativar) — evita clique
// acidental em ações que afetam o acesso de uma pessoa de verdade à
// plataforma.
export default function ConfirmModal({
  show,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmColor = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onClose={onCancel} size="md">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        <p className="text-sm text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button color="light" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            color={confirmColor}
            className={confirmColor === 'warning' ? 'bg-orange enabled:hover:bg-orange-dark' : ''}
            onClick={onConfirm}
            isProcessing={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
