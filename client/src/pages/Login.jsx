// src/pages/Login.jsx
import { useState } from "react";
import { loginUser } from "../api/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await loginUser({ email, password });
    console.log(res);
    if (res.token) {
      localStorage.setItem("token", res.token);
      alert("Успешный вход!");
      setEmail("");
      setPassword("");
    } else {
      alert(res.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Войти</button>
    </form>
  );
}

