import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { operations as operationsApi, motifs as motifsApi, caisses as caissesApi } from '../api'; // Keep caissesApi for fetching default caisse

function FormPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [motifs, setMotifs] = useState([]);
  const [defaultCaisseId, setDefaultCaisseId] = useState(null); // State for the default caisse ID
  const [formData, setFormData] = useState({
    montant: '',
    motif: '',
    nom: '',
    description: '',
    date_operation: new Date().toISOString().split('T')[0],
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadRefs, setLoadRefs] = useState(true); // For motifs and default caisse loading
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

        // Fetch the first caisse to use as default
        const caissesRes = await caissesApi.list();
        if (!cancelled) {
          const fetchedCaisses = (caissesRes.success && caissesRes.data) ? caissesRes.data : [];
          if (fetchedCaisses.length > 0) {
            setDefaultCaisseId(fetchedCaisses[0].id);
          } else {
            // No caisses found, but the backend will create one implicitly.
            // So, do not set an error or disable the form based on this.
            setDefaultCaisseId(null); // Explicitly set to null if none found initially
          }
        }
      } catch (e) {
        if (!cancelled) {
          setMotifs([]);
          setDefaultCaisseId(null);
          // Only log error, don't show to user if it's about missing caisse, as it will be handled
          console.error('Failed to load references (motifs, caisses): ' + e.message);
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
    // Reset input value so the same file can be picked again if deleted
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

      // No longer check !defaultCaisseId here, rely on backend to assign/create caisse
      // The backend will ensure an operation has a caisse_id.
      // If defaultCaisseId is null, don't append it to data. The backend should figure it out.
      const motif_id = await findOrCreateMotif(formData.motif); // Re-insert the declaration

      if (!motif_id) { // Perform the check after declaration
        throw new Error("Impossible de créer ou trouver le motif");
      }

      // No longer combine 'nom' into 'descriptionParts'. Send 'nom' separately.
      // 'description' now only contains the actual description.
      const description = formData.description.trim() || '';

      const data = new FormData();
      data.append('type', type);
      data.append('montant', montant);
      data.append('motif_id', parseInt(String(motif_id), 10));
      data.append('description', description); // Use cleaned description
      data.append('date_operation', formData.date_operation);
      if (defaultCaisseId) { // Only append caisse_id if it's known
        data.append('caisse_id', defaultCaisseId);
      }
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach((file) => {
          data.append('documents[]', file);
        });
      }
      data.append('nom', formData.nom.trim()); // Send nom separately
      
      await operationsApi.create(data);

      setSuccess('✅ Opération enregistrée avec succès!');
      
      // Dispatch event for other components that might be listening (e.g. if open in another tab)
      window.dispatchEvent(new CustomEvent('operationsUpdated'));
      
      // Navigate immediately to home
      navigate('/');
    } catch (err) {
      setError('❌ ' + (err.message || 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>{type === 'entree' ? 'Nouvelle Entrée' : 'Nouvelle Sortie'}</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ fontSize: '14px' }}
        >
          ← Retour à l&apos;accueil
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <strong>Erreur:</strong> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <strong>Succès:</strong> {success}
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Redirection vers l&apos;accueil...
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="date_operation">Date de l'opération:</label>
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
              placeholder="Saise le nom"
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
              placeholder="Saisissez"
              list="motifs-list"
              required
              disabled={loadRefs}
            />
            <datalist id="motifs-list">
              {motifs.map((m) => (
                <option key={m.id} value={m.nom} />
              ))}
            </datalist>
           
          </div>

          <div className="form-group">
            <label htmlFor="montant">
              Montant (MAD): *{' '}
              <span style={{ color: type === 'entree' ? '#27ae60' : '#e74c3c' }}>
                {type === 'entree' ? '+' : '-'}
              </span>
            </label>
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
            <label htmlFor="description">Description (optionnel):</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Ajouter une description..."
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
              <div style={{ marginTop: '10px', border: '1px solid #eee', borderRadius: '5px', padding: '10px', background: '#f9f9f9' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#27ae60' }}>
                  {formData.documents.length} fichier(s) prêt(s) à l'envoi:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {formData.documents.map((file, idx) => (
                    <li key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '13px',
                      padding: '4px 0',
                      borderBottom: idx === formData.documents.length - 1 ? 'none' : '1px solid #eee'
                    }}>
                      <span style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>
                        📄 {file.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#e74c3c', 
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0 5px'
                        }}
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
              Vous pouvez ajouter les fichiers un par un ou plusieurs à la fois.
            </small>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button
              type="submit"
              className={`btn ${type === 'entree' ? 'btn-success' : 'btn-danger'}`}
              disabled={loading || loadRefs} // Form is always submittable, backend handles caisse
              style={{ flex: 1 }}
            >
              {loading ? 'Enregistrement...' : `Enregistrer ${type === 'entree' ? 'Entrée' : 'Sortie'}`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              style={{ flex: 1 }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormPage;