import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cashierAPI } from '../services/api';

function OperationForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    montant: '',
    motif: '', // Changed from motif_id to motif (free text)
    description: '',
    nom: '', // Added name field
    date_operation: new Date().toISOString().split('T')[0],
    documents: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      documents: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.montant || parseFloat(formData.montant) <= 0) {
        throw new Error('Montant invalide');
      }
      if (!formData.motif) {
        throw new Error('Veuillez saisir un motif');
      }
      if (!formData.nom) {
        throw new Error('Veuillez saisir un nom');
      }

      // Create operation data - we'll use a default motif_id for now
      // In a real app, you might want to create a new motif in the database
      const operationData = {
        type: type,
        montant: parseFloat(formData.montant),
        motif: formData.motif, // Send custom motif text
        nom: formData.nom,
        description: formData.description,
        date_operation: formData.date_operation,
        caisse_id: 1,
        utilisateur_id: 1,
      };

      // For demo, we'll simulate API call
      console.log('Submitting operation:', operationData);
      
      // In a real app:
      // const response = await cashierAPI.createOperation(operationData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Upload document if exists (in real app)
      // if (formData.document && response.data.id) {
      //   await cashierAPI.uploadDocument(response.data.id, formData.document);
      // }

      setSuccess('Opération enregistrée avec succès!');
      
      // Reset form
      setFormData({
        montant: '',
        motif: '',
        description: '',
        nom: '',
        date_operation: new Date().toISOString().split('T')[0],
        documents: [],
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 style={{ color: type === 'entree' ? '#27ae60' : '#e74c3c', marginBottom: '30px' }}>
        {type === 'entree' ? ' Nouvelle Entrée' : ' Nouvelle Sortie'}
      </h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
          <label htmlFor="nom">Nom:</label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Ex: Achat fournitures, Vente produit..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="motif">
            Motif:
          </label>
          <input
            type="text"
            id="motif"
            name="motif"
            value={formData.motif}
            onChange={handleChange}
            placeholder="Saisissez le motif de l'opération..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="montant">
            Montant (MAD): <span style={{ color: type === 'entree' ? '#27ae60' : '#e74c3c' }}>
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
            placeholder="Ajouter une description détaillée..."
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
          <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
            Formats acceptés: PDF, JPG, PNG (max 10MB par fichier)
          </small>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button
            type="submit"
            className={`btn ${type === 'entree' ? 'btn-success' : 'btn-danger'}`}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                Enregistrement...
              </>
            ) : (
              `Enregistrer ${type === 'entree' ? 'Entrée' : 'Sortie'}`
            )}
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
  );
}

export default OperationForm;