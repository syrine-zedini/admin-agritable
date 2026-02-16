"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import StatCard from "@/components/clientB2C/StatCard";
import AddCustomerModal from "@/components/clientB2C/AddCustomerModal";
import ClientsTable from "@/components/clientB2C/ClientsTable";
import ClientsHeader from "@/components/clientB2C/ClientsHeader";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ClientsB2C() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  };

  // 🔹 Fetch clients B2C au chargement
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/clients-b2c");
        setCustomers(res.data.data || res.data || []);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger les clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredCustomers = customers.filter(customer => {
  
  const matchesSearch =
    customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phoneNumber?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesSearch; 
});


  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-slate-700 relative">

      <ClientsHeader onAdd={() => setShowAddCustomer(true)} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Customers" value={customers.length.toString()} subValue="B2C users" />
        <StatCard title="Active Today" value="0" subValue="0% of total" />
        <StatCard title="Negative Balances" value="0" subValue="Requires attention" textColor="text-red-500" />
        <StatCard title="Avg. Order Value" value="0.00 TND" subValue="Across all orders" />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      )}

      <ClientsTable
        customers={filteredCustomers}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {showAddCustomer && (
        <AddCustomerModal
          api={api}
          setCustomers={setCustomers}
          generateTemporaryPassword={generateTemporaryPassword}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          onClose={() => setShowAddCustomer(false)}
        />
      )}

    </div>
  );
}
