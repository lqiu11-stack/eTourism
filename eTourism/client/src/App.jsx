import { Routes, Route } from "react-router-dom";
import { LoginPage } from "/Users/angela/Desktop/software team/project/eTourism/client/src/Pages/Login/LoginPage.jsx";
import { PasswordReset } from "/Users/angela/Desktop/software team/project/eTourism/client/src/Pages/PasswordReset/PassWordReset.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset" element={<PasswordReset />} />
    </Routes>
  );
}

export default App;