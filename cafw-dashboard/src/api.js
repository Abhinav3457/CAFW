import axios from "axios";

const API = axios.create({
    baseURL: "https://cafw-backend.onrender.com",
});

API.interceptors.request.use(config => {
    const token = localStorage.getItem("cafw_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getStats             = () => API.get("/dashboard/stats");
export const getRecentAttacks     = () => API.get("/dashboard/recent-attacks");
export const getCategoryBreakdown = () => API.get("/dashboard/category-breakdown");
export const getTopAttackers      = () => API.get("/dashboard/top-attackers");
export const getLogs              = (params) => API.get("/logs/", { params });
export const getRules             = () => API.get("/rules/");
export const toggleRule           = (id, is_active) =>
    API.patch(`/rules/${id}`, { is_active });

export const authStatus           = () => API.get("/auth/status");
export const authSetup            = (data) => API.post("/auth/setup", data);
export const authVerifySetup      = (data) => API.post("/auth/verify-setup", data);
export const authLogin            = (data) => API.post("/auth/login", data);
export const authVerifyLogin      = (data) => API.post("/auth/verify-login", data);
export const authForgotPassword   = (data) => API.post("/auth/forgot-password", data);
export const authResetPassword    = (data) => API.post("/auth/reset-password", data);