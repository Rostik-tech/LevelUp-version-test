import { API } from "./api";

export const createPayment = async (data) => {
  const res = await API.post("/payments", data);
  return res.data;
};
