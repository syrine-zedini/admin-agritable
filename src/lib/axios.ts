import axios, { AxiosHeaders } from "axios";

const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
};

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 15000,
});

api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();

        // Ensure headers is an AxiosHeaders instance
        config.headers = config.headers ?? new AxiosHeaders();

        config.headers.set("Accept", "application/json");
        config.headers.set("Content-Type", "application/json");

        if (token) {
            config.headers.set("Authorization", `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;