import { useState, useEffect, useCallback } from 'react';
import { companyApi, categoryApi, transactionApi } from '../api';

export function useCompanies(isAuthenticated = true) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanies = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await companyApi.getAll();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (company) => {
    const newCompany = await companyApi.create(company);
    setCompanies((prev) => [...prev, newCompany]);
    return newCompany;
  };

  const updateCompany = async (id, data) => {
    const updated = await companyApi.update(id, data);
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    return updated;
  };

  const deleteCompany = async (id) => {
    await companyApi.delete(id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    companies,
    loading,
    error,
    addCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies,
  };
}

export function useCategories(isAuthenticated = true) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category) => {
    const newCategory = await categoryApi.create(category);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id, data) => {
    const updated = await categoryApi.update(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    return updated;
  };

  const deleteCategory = async (id) => {
    await categoryApi.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}

export function useTransactions(isAuthenticated = true) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await transactionApi.getAll();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction) => {
    const newTransaction = await transactionApi.create(transaction);
    setTransactions((prev) => [...prev, newTransaction]);
    return newTransaction;
  };

  const updateTransaction = async (id, data) => {
    const updated = await transactionApi.update(id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    return updated;
  };

  const deleteTransaction = async (id) => {
    await transactionApi.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
