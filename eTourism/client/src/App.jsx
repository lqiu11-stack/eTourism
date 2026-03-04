import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./Pages/Login/LoginPage.jsx";
import { PassWordReset } from "./Pages/PasswordReset/PassWordReset.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset" element={<PassWordReset />} />
    </Routes>
  );
}

export default App;