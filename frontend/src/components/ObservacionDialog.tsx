import { useState } from "react";

/** Diálogo que exige observaciones de al menos 10 caracteres (#2). */
export function ObservacionDialog({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  onConfirmar: (observaciones: string) => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  const confirmar = () => {
    if (texto.trim().length < 10) {
      setError("Se requieren observaciones (mínimo 10 caracteres).");
      return;
    }
    onConfirmar(texto.trim());
  };

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p className="muted">{mensaje}</p>
        <div className="field">
          <label className="field-label" htmlFor="observaciones">Observaciones *</label>
          <textarea
            id="observaciones"
            className="input"
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {error && <p className="field-error">{error}</p>}
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={confirmar}>
            {textoConfirmar}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
