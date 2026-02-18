import { API } from "./api";

export const getProducts = async () => {
  const res = await API.get("/products");
  return res.data;
};

export const createProduct = async (data) => {
  const res = await API.post("/products", data);
  return res.data;
};
