import axios from 'axios';

const request = axios.create({
    // baseURL: "http://localhost:8080",
    baseURL: "https://detonative-undefectively-julien.ngrok-free.dev",
    timeout: 5000
});

// 请求拦截器：自动加上 userId 和 role
request.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.userId) {
        config.headers["X-User-Id"] = user.userId;
    }
    if (user.role) {
        config.headers["X-User-Role"] = user.role;
    }

    return config;
});

export default request;