import { createClientB2C } from "@/service/clientsB2C.service";
import { useState } from "react";

export const useClientsB2C = () => {
  const [customers,setCustomers] = useState<any[]>([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const generateTemporaryPassword = () =>
    Math.random().toString(36).slice(-8) +
    Math.random().toString(36).slice(-8).toUpperCase();

  const addCustomer = async (formData:any) => {
    try{
      setLoading(true);
      setError("");

      const res = await createClientB2C({
        ...formData,
        password: generateTemporaryPassword(),
        roleName:"ClientB2C"
      });

      if(res.data){
        setCustomers(prev=>[res.data,...prev]);
      }
    }catch(err:any){
      setError(err.response?.data?.message || "Erreur création client");
    }finally{
      setLoading(false);
    }
  };

  return {
    customers,
    setCustomers,
    loading,
    error,
    addCustomer
  };
};
