import axios from "axios";

const diaChiApi = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const api = axios.create({
  baseURL: diaChiApi,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Instance riêng cho khách hàng, dùng customer_token
const customerInstance = axios.create({
  baseURL: diaChiApi,
  headers: {
    "Content-Type": "application/json",
  },
});

customerInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("customer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  dangNhap: (duLieu) => api.post("/auth/dang-nhap", duLieu),
  dangKy: (duLieu) => api.post("/auth/dang-ky", duLieu),
  thongTin: () => api.get("/auth/thong-tin"),
  capNhat: (duLieu) => api.put("/auth/cap-nhat", duLieu),
  doiMatKhau: (duLieu) => api.put("/auth/doi-mat-khau", duLieu),
};

export const phongApi = {
  layDanhSach: (params) => api.get("/phong", { params }),
  layPhongTrong: (params) => api.get("/phong/phong-trong", { params }),
};

export const customerApi = {
  layPhongCongKhai: (params) => api.get("/phong/cong-khai", { params }),
  layPhongTrongCongKhai: (params) =>
    api.get("/phong/cong-khai/phong-trong", { params }),
  layChiTietPhongCongKhai: (id) => api.get(`/phong/cong-khai/${id}`),
  kiemTraPhongCoSan: (id, params) =>
    api.get(`/phong/cong-khai/${id}/kiem-tra-co-san`, { params }),
  taoYeuCauDatPhong: (duLieu) => api.post("/dat-phong/cong-khai", duLieu),
};

export const datPhongApi = {
  layDanhSach: (params) => api.get("/dat-phong", { params }),
  taoMoi: (duLieu) => api.post("/dat-phong", duLieu),
  layLichSuCuaToi: (params) => api.get("/dat-phong/cua-toi", { params }),
};

// API cho khách hàng đã đăng nhập (dùng customer_token)
export const customerAuthApi = {
  thongTin: () => customerInstance.get("/auth/thong-tin"),
  capNhat: (duLieu) => customerInstance.put("/auth/cap-nhat", duLieu),
  doiMatKhau: (duLieu) => customerInstance.put("/auth/doi-mat-khau", duLieu),
};

export const customerDatPhongApi = {
  taoMoi: (duLieu) => customerInstance.post("/dat-phong", duLieu),
  layLichSuCuaToi: (params) =>
    customerInstance.get("/dat-phong/cua-toi", { params }),
};

export const chatbotApi = {
  hoiDap: (tinNhan) => api.post("/chatbot/hoi-dap", { tinNhan }),
};

export default api;
