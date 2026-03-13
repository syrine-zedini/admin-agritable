"use client";
import { useState, useEffect } from "react";
import { AdminUser, CreateAdminInput } from "@/types/admin.types";
import {
  getAdmins,
  createAdmin,
  toggleAdminStatus,
  deleteAdmin,
} from "@/service/admin.service";

export const useAdminPage = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // -------------------- FETCH --------------------
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdmins();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // -------------------- CREATE --------------------
  const handleCreateAdmin = async (input: CreateAdminInput) => {
    try {
      await createAdmin(input);
      await fetchAdmins(); // recharge la liste
      setIsModalOpen(false);
    } catch (err: any) {
      throw err; // remonté au modal pour afficher l'erreur
    }
  };

  // -------------------- TOGGLE STATUS --------------------
  const handleToggleStatus = async (id: string, currentStatus: "Active" | "Suspended") => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      await toggleAdminStatus(id, newStatus);
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // -------------------- DELETE --------------------
  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    admins,
    loading,
    error,
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    handleCreateAdmin,
    handleToggleStatus,
    handleDeleteAdmin,
  };
};