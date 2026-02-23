import React, { useState, useEffect } from 'react';
import { operations as operationsApi, motifs as motifsApi, caisses as caissesApi } from '../api';

function AddOperationModal({ type, onClose, onOperationAdded }) {
  const [motifs, setMotifs] = useState([]);
  const [defaultCaisseId, setDefaultCaisseId] = useState(null);
  const [formData, setFormData] = useState({
    montant: '',
    motif: '',
    nom: '',
    description: '',
    date_operation: new Date().toISOString().split('T')[0],
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadRefs, setLoadRefs] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchReferences = async () => {
      try {
        const motifsRes = await motifsApi.list(type || undefined);
        if (!cancelled) {
          setMotifs((motifsRes.success && motifsRes.data) ? motifsRes.data : []);
        }

        const caissesRes = await caissesApi.list();
        if (!cancelled) {
          const fetchedCaisses = (caissesRes.success && caissesRes.data) ? caissesRes.data : [];
          if (fetchedCaisses.length > 0) {
            setDefaultCaisseId(fetchedCaisses[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load references:', e.message);
        }
      } finally {
        if (!cancelled) setLoadRefs(false);
      }
    };
    fetchReferences();
    return () => { cancelled = true; };
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData((prev) => ({ 
      ...prev, 
      documents: [...prev.documents, ...newFiles] 
    }));
    // Reset input so picking the same file again triggers onChange
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const findOrCreateMotif = async (motifName) => {
    const name = (motifName || '').trim();
    if (!name) return null;
    
    const found = motifs.find((m) => (m.nom || '').trim().toLowerCase() === name.toLowerCase());
    
    if (found) {
      return found.id;
    } else {
      try {
        const newMotif = await motifsApi.create({
          nom: name,
          type: type,
          description: `Created from operation form`,
          couleur: type === 'entree' ? '#27ae60' : '#e74c3c'
        });
        
        if (newMotif.success && newMotif.data) {
          setMotifs(prev => [...prev, newMotif.data]);
          return newMotif.data.id;
        } else {
          throw new Error('Could not create new motif');
        }
      } catch (error) {
        console.error('Error creating motif:', error);
        throw new Error('Failed to create new motif in database');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const montant = parseFloat(formData.montant);
      if (!formData.montant || isNaN(montant) || montant <= 0) {
        throw new Error('Montant invalide');
      }
      if (!formData.motif.trim()) {
        throw new Error('Veuillez saisir un motif');
      }
      if (!formData.nom.trim()) {
        throw new Error('Veuillez saisir un nom');
      }

      const motif_id = await findOrCreateMotif(formData.motif);

      if (!motif_id) {
        throw new Error("Impossible de créer ou trouver le motif");
      }

      const descriptionParts = [
        `Nom: ${formData.nom.trim()}`,
        `Description: ${formData.description.trim() || 'Aucune description'}`
      ].filter(Boolean);

      const data = new FormData();
      data.append('type', type);
      data.append('montant', montant);
      data.append('motif_id', parseInt(String(motif_id), 10));
      data.append('description', descriptionParts.join('\n'));
      data.append('date_operation', formData.date_operation);
      if (defaultCaisseId) {
        data.append('caisse_id', defaultCaisseId);
      }
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach((file) => {
          data.append('documents[]', file);
        });
      }

      const response = await operationsApi.create(data);
      
      if (response.success) {
        setSuccess('✅ Opération enregistrée avec succès!');
        if (onOperationAdded) {
          onOperationAdded(response.data);
        }
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(response.message || "Erreur lors de l'enregistrement");

      }
    } catch (err) {
      setError('❌ ' + (err.message || 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{type === 'entree' ? 'Nouvelle Entrée' : 'Nouvelle Sortie'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="date_operation">Date:</label>
              <input
                type="date"
                id="date_operation"
                name="date_operation"
                value={formData.date_operation}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom">Nom: *</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Achat fournitures..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="motif">Motif: *</label>
              <input
                type="text"
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                placeholder="Saisissez le motif..."
                list="modal-motifs-list"
                required
                disabled={loadRefs}
              />
              <datalist id="modal-motifs-list">
                {motifs.map((m) => (
                  <option key={m.id} value={m.nom} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="montant">Montant (MAD): *</label>
              <input
                type="number"
                id="montant"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Détails (optionnel)..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">Documents (optionnels):</label>
              <input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
              />
              {formData.documents && formData.documents.length > 0 && (
                <div style={{ marginTop: '5px', background: '#f8f9fa', padding: '5px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {formData.documents.map((file, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '2px 0' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📄 {file.name}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          style={{ border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px', fontSize: '11px' }}>
                Vous pouvez ajouter les fichiers un par un ou plusieurs à la fois.
              </small>
            </div>

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
                  type="submit"
                  className={`btn ${type === 'entree' ? 'btn-success' : 'btn-danger'}`}
                  disabled={loading || loadRefs}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <span className="save-icon">💾</span>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddOperationModal;