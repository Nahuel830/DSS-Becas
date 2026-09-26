/** Diálogo de confirmación modal (eliminar, descartar cambios, restablecer). */
export function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p className="muted">{mensaje}</p>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onCancelar}>
            {textoCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}
