import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Главная</Link> |{" "}
      <Link to="/login">Вход</Link> |{" "}
      <Link to="/register">Регистрация</Link> |{" "}
      <Link to="/cart">Корзина</Link>
    </nav>
  );
}

export default Navbar;
