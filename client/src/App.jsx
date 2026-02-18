import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Products from "./pages/Products.jsx";
import Cart from "./pages/Cart.jsx";
//import Profile from "./pages/Profile.jsx"; // если есть
//import Orders from "./pages/Orders.jsx";   // если есть
//import About from "./pages/About.jsx";     // если есть
//import Contact from "./pages/Contact.jsx"; // если есть

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<Products />} />

        {/* Регистрация и вход */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Страницы пользователя */}
        <Route path="/cart" element={<Cart />} />
        
      </Routes>
    </Router>
  );
}

export default App;
