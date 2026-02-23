import React, { useState, useEffect } from 'react';

function EditOperationModal({ operation, onUpdate, onClose, isMobile }) {
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    montant: '',
    motif: '',
    description: '',
    date_operation: ''
  });
  const [newDocuments, setNewDocuments] = useState([]); // State for new documents upload

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialiser le formulaire avec les données de l'opération (API: motif_nom, reference)
  useEffect(() => {
    if (operation) {
      setFormData({
        nom: operation.nom || '', // Initialize from operation.nom
        type: operation.type || '',
        montant: operation.montant || '',
        motif: operation.motif || operation.motif_nom || '',
        description: operation.description || '',
        date_operation: operation.date_operation
          ? new Date(operation.date_operation).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      });
      setNewDocuments([]); // Reset new documents on operation change
      
      // Afficher section avancée si description existe
      if (operation.description) {
        setShowAdvanced(true);
      }
    }
  }, [operation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setNewDocuments(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.montant || parseFloat(formData.montant) <= 0) {
        throw new Error('Montant invalide. Doit être supérieur à 0');
      }
      if (!formData.type) {
        throw new Error('Le type d\'opération est requis');
      }
      if (!formData.date_operation) {
        throw new Error('La date est requise');
      }

      // Backend only updates description (and now nom)
      const updatedOperation = {
        ...operation,
        nom: formData.nom, // Send updated nom
        description: formData.description || '',
        newDocuments: newDocuments, // Include new documents array
        // Motif, montant, and date_operation are not updated by this endpoint,
        // but included for consistency if the backend changes in the future.
        motif: formData.motif,
        montant: parseFloat(formData.montant),
        date_operation: new Date(formData.date_operation).toISOString()
      };

      onUpdate(updatedOperation);
      
    } catch (err) {
      setError(err.message);
      // Scroll to error on mobile
      if (isMobile) {
        window.scrollTo(0, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!operation) return null;

  const DOCUMENT_BASE_URL = 'http://localhost:8000/storage/'; // Define base URL here

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div 
        className="modal edit-modal"
        style={isMobile ? { 
          width: '95%',
          maxHeight: '90vh',
          margin: '10px'
        } : {}}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {isMobile ? ' Modifier' : ' Modifier l\'opération'}
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" role="alert">
              <strong>Erreur:</strong> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="edit-form">
            {/* Informations de base */}
            <div className="form-section">
              <h3 className="form-section-title">Informations de base</h3>
              
              <div className={`form-grid ${isMobile ? 'mobile' : ''}`}>
                <div className="form-group">
                  <label htmlFor="nom" className="form-label">Nom / Référence</label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ex: Achat fournitures"
                    disabled={loading}
                    maxLength="100"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    <span className="required">*</span> Type
                  </label>
                  <div className="type-selector">
                    <button
                      type="button"
                      className={`type-option ${formData.type === 'entree' ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'entree' }))}
                      disabled={loading}
                    >
                      <span className="type-indicator entree">+</span>
                      <span>Entrée</span>
                    </button>
                    <button
                      type="button"
                      className={`type-option ${formData.type === 'sortie' ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'sortie' }))}
                      disabled={loading}
                    >
                      <span className="type-indicator sortie">-</span>
                      <span>Sortie</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`form-grid ${isMobile ? 'mobile' : ''}`}>
                <div className="form-group">
                  <label htmlFor="montant" className="form-label">
                    <span className="required">*</span> Montant (MAD)
                  </label>
                  <div className="amount-input-container">
                    <input
                      type="number"
                      id="montant"
                      name="montant"
                      value={formData.montant}
                      onChange={handleChange}
                      className="form-input"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                      disabled={loading}
                    />
                    <span className="currency">MAD</span>
                  </div>
                  <div className={`amount-preview ${formData.type}`}>
                    {formData.montant ? (
                      <>
                        {formData.type === 'entree' ? '+' : '-'}
                        {parseFloat(formData.montant).toFixed(2)} MAD
                      </>
                    ) : 'Saisir un montant'}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="date_operation" className="form-label">
                    <span className="required">*</span> Date
                  </label>
                  <input
                    type="date"
                    id="date_operation"
                    name="date_operation"
                    value={formData.date_operation}
                    onChange={handleChange}
                    className="form-input"
                    required
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            
            {/* Motif */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="required">*</span> Motif
              </h3>
              <div className="form-group">
                <input
                  type="text"
                  id="motif"
                  name="motif"
                  value={formData.motif}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: Achat de matériel, Vente produit..."
                  disabled={loading}
                  maxLength="200"
                />
              </div>
            </div>
            
            {/* Section avancée (optionnelle) */}
            <div className="form-section advanced-section">
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                aria-expanded={showAdvanced}
              >
                <span className="toggle-icon">
                  {showAdvanced ? '▼' : '▶'}
                </span>
                {isMobile ? 'Options' : 'Options avancées'}
              </button>
              
              {showAdvanced && (
                <div className="advanced-content">
                  <div className="form-group">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-textarea"
                      placeholder="Ajouter des détails supplémentaires..."
                      rows={isMobile ? 2 : 3}
                      disabled={loading}
                      maxLength="500"
                    />
                    <div className="char-counter">
                      {formData.description.length}/500 caractères
                    </div>
                  </div>

                  {/* Document Management */}
                  <div className="form-group">
                    <label htmlFor="document" className="form-label">
                      Documents (optionnels)
                    </label>
                    {operation.documents && operation.documents.length > 0 && (
                      <div className="current-document" style={{ marginBottom: '10px' }}>
                        Documents actuels: {' '}
                        {operation.documents.map((doc, index) => (
                          <a key={doc.id || index} href={`${DOCUMENT_BASE_URL}${doc.chemin_fichier}`} target="_blank" rel="noopener noreferrer" title={doc.nom_fichier} style={{ marginRight: '5px', textDecoration: 'underline' }}>
                            {doc.nom_fichier}
                          </a>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      id="document"
                      name="document"
                      onChange={handleFileChange}
                      className="form-input"
                      disabled={loading}
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                    />
                    <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
                      Sélectionnez de nouveaux fichiers pour remplacer les actuels (PDF, JPG, PNG - max 5MB par fichier).
                    </small>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </button>
              
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.confirm('Voulez-vous réinitialiser le formulaire ?')) {
                      setFormData({
                        nom: operation.nom || '',
                        type: operation.type || '',
                        montant: operation.montant || '',
                        motif: operation.motif || '',
                        description: operation.description || '',
                        date_operation: operation.date_operation ? 
                          new Date(operation.date_operation).toISOString().split('T')[0] : 
                          new Date().toISOString().split('T')[0]
                      });
                      setNewDocuments([]); // Reset new documents as well
                    }
                  }}
                  disabled={loading}
                >
                  Réinitialiser
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary save-btn"
                  disabled={loading || !formData.montant || !formData.type || !formData.date_operation}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      {isMobile ? 'En cours...' : 'Enregistrement...'}
                    </>
                  ) : (
                    <>
                      <span className="save-icon">💾</span>
                      {isMobile ? 'Enregistrer' : 'Enregistrer les modifications'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Info footer */}
        <div className="modal-footer">
          <div className="form-info">
            <span className="required">*</span> Champs obligatoires
            {isMobile && (
              <div className="mobile-hint">
                Appuyez sur un champ pour modifier
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditOperationModal;