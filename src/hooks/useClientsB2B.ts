import { useState, useEffect } from "react";
import { getClientsB2B } from "@/service/clientsB2B.service";
import { Client } from "@/types/clientB2B.types";

export default function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getClientsB2B();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, error, fetchClients, setClients };
}
