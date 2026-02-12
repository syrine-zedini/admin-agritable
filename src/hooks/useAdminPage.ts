import { useState } from "react";
import { getAdmins } from "@/service/admin.service";

export const useAdminPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const admins = getAdmins();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return {
    admins,
    isModalOpen,
    openModal,
    closeModal,
  };
};
