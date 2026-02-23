import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '../Components/SearchBar';
import Buttons from '../Components/Buttons';
import OperationsTable from '../Components/OperationsTable';
import BalanceCard from '../Components/BalanceCard';
import EditOperationModal from '../Components/EditOperationModal';
import { operations as operationsApi, balance, caisses as caissesApi } from '../api'; // Import caissesApi

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOperation, setEditingOperation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({});
  const [currentCaisseId, setCurrentCaisseId] = useState(null); // Renamed from selectedCaisseId

  // Fetch Caisses and set initial currentCaisseId (using the first available caisse)
  useEffect(() => {
    let cancelled = false;
    const fetchCaisse = async () => {
      try {
        const caissesRes = await caissesApi.list();
        if (!cancelled && caissesRes.success && caissesRes.data && caissesRes.data.length > 0) {
          setCurrentCaisseId(caissesRes.data[0].id); // Select the first caisse by default
        } else if (!cancelled) {
          // If no caisses found, set currentCaisseId to null or handle appropriately
          // The backend should implicitly create one on operation creation.
          // For now, keep it null if none exist to allow loadOperations to wait.
          setCurrentCaisseId(null); 
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Error fetching caisse:', e);
          setCurrentCaisseId(null);
        }
      } finally {
        if (!cancelled) setLoading(false); // Ensure loading is set to false here
      }
    };
    fetchCaisse();
    return () => { cancelled = true; };
  }, []); // Run only once on mount

    const loadOperations = useCallback(async (caisseId) => {
      setLoading(true);
      try {
        const params = caisseId ? { caisse_id: caisseId } : {};
        const operationsRes = await operationsApi.list(params);
        const list = (operationsRes.success && operationsRes.data ? operationsRes.data : []) || [];
        const sorted = [...list].sort(
          (a, b) =>
            new Date(b.date_operation || b.created_at) -
            new Date(a.date_operation || a.created_at)
        );
        setOperations(sorted);
  
        // Fetch statistics from backend
        const statsRes = await balance.stats(params);
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setOperations([]);
        setStats({});
      } finally {
        setLoading(false);
      }
    }, []);
  
    // Load operations on mount and whenever currentCaisseId changes or operationsUpdated event
    useEffect(() => {
      loadOperations(currentCaisseId);
      
      const handleOperationsUpdated = async () => {
        // Always try to re-fetch the latest caisse ID from the backend
        // to ensure we have the most up-to-date ID, especially if a caisse was implicitly created.
        try {
            const caissesRes = await caissesApi.list();
            if (caissesRes.success && caissesRes.data && caissesRes.data.length > 0) {
                const fetchedCaisseId = caissesRes.data[0].id;
                // Only update state if the ID is different to avoid unnecessary re-renders
                if (fetchedCaisseId !== currentCaisseId) {
                    setCurrentCaisseId(fetchedCaisseId);
                } else {
                    // If ID is the same, just re-load operations for the current caisse
                    loadOperations(currentCaisseId);
                }
            } else {
                // If no caisses found even after event, set currentCaisseId to null
                // and clear operations/stats
                if (currentCaisseId !== null) {
                    setCurrentCaisseId(null);
                }
                setOperations([]);
                setStats({});
                setLoading(false);
            }
        } catch (e) {
            console.error('Error re-fetching caisses on update event:', e);
            if (currentCaisseId !== null) {
                setCurrentCaisseId(null);
            }
            setOperations([]);
            setStats({});
            setLoading(false);
        }
    };
    window.addEventListener('operationsUpdated', handleOperationsUpdated);
    window.addEventListener('operationChange', handleOperationsUpdated);
    return () => {
      window.removeEventListener('operationsUpdated', handleOperationsUpdated);
      window.removeEventListener('operationChange', handleOperationsUpdated);
    };
  }, [currentCaisseId, loadOperations]); // Rerun when currentCaisseId or loadOperations changes

  const handleDeleteOperation = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) return;
    try {
      await operationsApi.delete(id);
      loadOperations(currentCaisseId); // Reload for the current caisse
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleEditOperation = (operation) => {
    setEditingOperation(operation);
    setShowEditModal(true);
  };

  const handleUpdateOperation = async (updatedOperation) => {
    try {
      if (updatedOperation.newDocuments && updatedOperation.newDocuments.length > 0) {
        const formData = new FormData();
        formData.append('nom', updatedOperation.nom);
        formData.append('description', updatedOperation.description);
        updatedOperation.newDocuments.forEach(file => {
          formData.append('documents[]', file);
        });
        formData.append('montant', updatedOperation.montant); // Send montant
        // We'll need to define operations.updateWithDocument that accepts FormData
        await operationsApi.updateWithDocument(updatedOperation.id, formData);
      } else {
        await operationsApi.update(updatedOperation.id, {
          nom: updatedOperation.nom,
          description: updatedOperation.description,
          montant: updatedOperation.montant, // Send montant
        });
      }
      
      loadOperations(currentCaisseId); // Reload for the current caisse
      setShowEditModal(false);
      setEditingOperation(null);

      
    } catch (err) {
      alert(err.message || 'Erreur lors de la modification');
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingOperation(null);
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1> Gestion de Caisse</h1>
          <div
            style={{
              color: '#3498db',
              fontSize: '14px',
              marginTop: '5px',
            }}
          >
            Total: {operations.length} opération(s)
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      <div className="content">
        <div className="main-content">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par nom, motif, montant..."
          />
          <Buttons />
          <div style={{ position: 'relative', minHeight: '200px' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                }}
              >
                <div
                  className="loading"
                  style={{ width: '40px', height: '40px' }}
                />
              </div>
            ) : (
              <OperationsTable
                operations={operations} // No need to filter by selectedCaisseId anymore
                searchTerm={searchTerm}
                onDeleteOperation={handleDeleteOperation}
                onEditOperation={handleEditOperation}
              />
            )}
          </div>
        </div>
        <div>
          <BalanceCard selectedCaisseId={currentCaisseId} /> {/* Pass selectedCaisseId correctly */}
          <div className="card" style={{ marginTop: '20px' }}>
            <h3> Statistiques</h3>
            <div style={{ marginTop: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span>Opérations aujourd&apos;hui:</span>
                <strong>{stats.operations_today || 0}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span>Opérations ce mois:</span>
                <strong>{stats.operations_this_month || 0}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span>Total opérations:</span>
                <strong>{stats.total_operations || 0}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span>Total entrées ce mois:</span>
                <strong>{Number(stats.total_entrees_this_month || 0).toFixed(2)} MAD</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span>Total sorties ce mois:</span>
                <strong>{Number(stats.total_sorties_this_month || 0).toFixed(2)} MAD</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditOperationModal
          operation={editingOperation}
          onUpdate={handleUpdateOperation}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default HomePage;

