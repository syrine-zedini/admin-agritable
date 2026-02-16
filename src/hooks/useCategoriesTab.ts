import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Category } from '../types/category';


const fetchCategories = async (): Promise<Category[]> => {
    const res = await axiosInstance.get('/categories');
    return res.data.data; // assuming your apiSuccess returns { data, message }
};

export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        staleTime: 1000 * 60 * 5, // cache for 5 mins
    });
};