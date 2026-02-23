import React, { useState } from 'react';

// Base URL for documents stored in Laravel's public storage disk
const DOCUMENT_BASE_URL = 'http://localhost:8000/storage/';

function OperationsTable({ operations, searchTerm, onDeleteOperation, onEditOperation }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date_operation', direction: 'desc' });

  // Filtrer les opérations
  const filteredOperations = operations.filter(op => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nom = op.nom || op.reference || '';
    const motif = op.motif_nom || (op.motif && op.motif.nom) || ''; // Access motif.nom
    return (
      nom.toLowerCase().includes(term) ||
      motif.toLowerCase().includes(term) ||
      (op.montant != null && op.montant.toString().includes(term)) ||
      (op.caisse && op.caisse.nom && op.caisse.nom.toLowerCase().includes(term)) // Access caisse.nom
    );
  });

  // Trier les opérations
  const sortedOperations = [...filteredOperations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Handle nested motif and caisse properties for sorting
    if (sortConfig.key === 'motif') {
      aVal = a.motif ? a.motif.nom : '';
      bVal = b.motif ? b.motif.nom : '';
    } else if (sortConfig.key === 'caisse') {
      aVal = a.caisse ? a.caisse.nom : '';
      bVal = b.caisse ? b.caisse.nom : '';
    }
    
    if (sortConfig.key === 'date_operation') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (sortConfig.key === 'montant') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Calculer les totaux (these are still client-side calculations, will update in next step if user requests)
  const totalEntrees = sortedOperations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + (Number(op.montant) || 0), 0);
  
  const totalSorties = sortedOperations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + (Number(op.montant) || 0), 0);
  
  const montantTotal = totalEntrees - totalSorties;


  return (
    <div className="table-container">
      <table>
        <thead><tr><th onClick={() => requestSort('nom')} className="sortable">Nom {getSortIcon('nom')}</th><th onClick={() => requestSort('type')} className="sortable">Type {getSortIcon('type')}</th><th onClick={() => requestSort('montant')} className="sortable">Montant {getSortIcon('montant')}</th><th>Montant Avant</th>{/* This is still client-side calculation */}<th onClick={() => requestSort('motif')} className="sortable">Motif {getSortIcon('motif')}</th><th onClick={() => requestSort('date_operation')} className="sortable">Date {getSortIcon('date_operation')}</th><th>Documents</th>{/* New column for documents */}<th>Actions</th></tr></thead>
        <tbody>
          {sortedOperations.length === 0 ? (<><tr><td colSpan="8" className="empty-table"><div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div><div>Aucune opération trouvée</div></td></tr>{Array.from({ length: 5 }).map((_, index) => (<tr key={`empty-${index}`} style={{ height: '50px' }}><td colSpan="8"></td></tr>))}</>) : (
            sortedOperations.map((operation) => (
              <tr key={operation.id}><td>{operation.nom || '-'}</td><td><span className={`type-badge type-${operation.type}`}>{operation.type === 'entree' ? 'ENTRÉE' : 'SORTIE'}</span></td><td className={`amount ${operation.type}`}>{operation.type === 'entree' ? '+' : '-'} {Number(operation.montant).toFixed(2)} MAD</td><td style={{ fontWeight: '500', color: '#2c3e50' }}>{Number(operation.solde_avant || 0).toFixed(2)} MAD {/* Using backend solde_avant safely */}</td><td>{operation.motif ? operation.motif.nom : '-'}</td>{/* Access motif.nom */}<td>{operation.date_operation ? new Date(operation.date_operation).toLocaleDateString('fr-FR') : '-'}</td>              <td>
                {operation.documents && operation.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                    {operation.documents.map((doc, index) => (
                      <a 
                        key={doc.id || index} 
                        href={`${DOCUMENT_BASE_URL}${doc.chemin_fichier}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={doc.nom_fichier}
                        style={{ 
                          color: '#3498db', 
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '120px'
                        }}
                      >
                        📄 {doc.nom_fichier}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#bdc3c7' }}>-</span>
                )}
              </td><td className="actions"><button className="btn-action btn-edit"onClick={() => onEditOperation(operation)}>Modifier</button><button className="btn-action btn-delete"onClick={() => onDeleteOperation(operation.id)}>Supprimer</button></td></tr>
            ))
          )}
        </tbody>
        <tfoot className="table-footer">
          <tr>
            <td colSpan="4" style={{ textAlign: 'left', padding: '15px 25px' }}>
              <strong>Total Entrées:</strong> <span className="total-entree">+{totalEntrees.toFixed(2)} MAD</span>
            </td>
            <td colSpan="4" style={{ textAlign: 'right', padding: '15px 25px' }}>
              <strong>Total Sorties:</strong> <span className="total-sortie">-{totalSorties.toFixed(2)} MAD</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default OperationsTable;