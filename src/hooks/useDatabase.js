import { useState, useEffect, useCallback } from 'react';
import { companyApi, categoryApi, transactionApi, exchangeRateApi, settingsApi, currencyApi, recurringTemplateApi } from '../api';

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

export function useExchangeRates(isAuthenticated = true) {
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRates = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await exchangeRateApi.getAll();
      setExchangeRates(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const upsertRate = async (fromCurrency, toCurrency, rate) => {
    const result = await exchangeRateApi.upsert(fromCurrency, toCurrency, rate);
    await fetchRates();
    return result;
  };

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      const result = await exchangeRateApi.refresh();
      await fetchRates();
      return result;
    } finally {
      setRefreshing(false);
    }
  };

  const getRate = (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1;
    const rate = exchangeRates.find(
      (r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );
    return rate?.rate || null;
  };

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    const rate = getRate(fromCurrency, toCurrency);
    if (rate === null) return null;
    return amount * rate;
  };

  return {
    exchangeRates,
    loading,
    error,
    refreshing,
    upsertRate,
    refreshRates,
    getRate,
    convertAmount,
    refetch: fetchRates,
  };
}

export function useSettings(isAuthenticated = true) {
  const [settings, setSettings] = useState({
    baseCurrency: 'EUR',
    exchangeRateApiKey: '',
    lastRateUpdate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings) => {
    const result = await settingsApi.update(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
    return result;
  };

  const setSetting = async (key, value) => {
    const result = await settingsApi.set(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
    return result;
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    setSetting,
    refetch: fetchSettings,
  };
}

export function useCurrencies(isAuthenticated = true) {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrencies = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await currencyApi.getAll();
      setCurrencies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const addCurrency = async (currency) => {
    const newCurrency = await currencyApi.create(currency);
    setCurrencies((prev) => [...prev, newCurrency]);
    return newCurrency;
  };

  const updateCurrency = async (code, data) => {
    const updated = await currencyApi.update(code, data);
    setCurrencies((prev) => prev.map((c) => (c.code === code ? { ...c, ...data } : c)));
    return updated;
  };

  const deleteCurrency = async (code) => {
    await currencyApi.delete(code);
    setCurrencies((prev) => prev.filter((c) => c.code !== code));
  };

  const setDefaultCurrency = async (code) => {
    await currencyApi.setDefault(code);
    setCurrencies((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.code === code ? 1 : 0 }))
    );
  };

  return {
    currencies,
    loading,
    error,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    refetch: fetchCurrencies,
  };
}

export function useRecurringTemplates(isAuthenticated = true) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await recurringTemplateApi.getAll();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (template) => {
    const result = await recurringTemplateApi.create(template);
    setTemplates((prev) => [...prev, result.template]);
    return result;
  };

  const updateTemplate = async (id, data, updateFutureInstances = false) => {
    const result = await recurringTemplateApi.update(id, { ...data, updateFutureInstances });
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    return result;
  };

  const deleteTemplate = async (id) => {
    await recurringTemplateApi.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const pauseTemplate = async (id) => {
    await recurringTemplateApi.pause(id);
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
    );
  };

  const resumeTemplate = async (id) => {
    await recurringTemplateApi.resume(id);
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'active' } : t))
    );
  };

  const skipOccurrence = async (templateId, transactionId) => {
    await recurringTemplateApi.skip(templateId, transactionId);
  };

  const generateOccurrences = async () => {
    const result = await recurringTemplateApi.generate();
    return result;
  };

  const getTemplateTransactions = async (id) => {
    return await recurringTemplateApi.getTransactions(id);
  };

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    pauseTemplate,
    resumeTemplate,
    skipOccurrence,
    generateOccurrences,
    getTemplateTransactions,
    refetch: fetchTemplates,
  };
}
