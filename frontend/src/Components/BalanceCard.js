import React, { useState, useEffect, useCallback } from 'react';
import { balance as balanceApi } from '../api';

function BalanceCard({ selectedCaisseId }) { // Accept selectedCaisseId as prop
  const [solde, setSolde] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedCaisseId ? { caisse_id: selectedCaisseId } : {};
      const res = await balanceApi.get(params);
      const data = (res.success && res.data) ? res.data : {};
      setSolde(parseFloat(data.solde) || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setSolde(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCaisseId]); // Add selectedCaisseId to dependencies

  useEffect(() => {
    fetchBalance();
    const handleChange = () => fetchBalance();
    window.addEventListener('storage', handleChange);
    window.addEventListener('operationChange', handleChange);
    window.addEventListener('operationsUpdated', handleChange); // Listen for operationsUpdated from FormPage
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('operationChange', handleChange);
      window.removeEventListener('operationsUpdated', handleChange);
    };
  }, [fetchBalance]);

  return (
    <div className="card">
      <h3> Montant Total</h3>
      <div className={`balance ${solde >= 0 ? 'positive' : 'negative'}`}>
        {loading ? (
          <div className="loading" />
        ) : (
          `${solde.toFixed(2)} MAD`
        )}
      </div>
      <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '0' }}>
        {solde >= 0 ? 'Solde positif' : 'Solde négatif'}
        <span style={{ display: 'block', marginTop: '5px', fontSize: '12px' }}>
          Dernière mise à jour: {new Date().toLocaleTimeString()}
        </span>
      </p>
      <button
        className="btn btn-secondary"
        onClick={fetchBalance}
        style={{ marginTop: '15px', width: '100%' }}
        disabled={loading}
      >
        {loading ? 'Chargement...' : 'Actualiser Montant Total'}
      </button>
    </div>
  );
}

export default BalanceCard;
