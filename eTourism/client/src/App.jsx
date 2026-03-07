import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./Pages/Login/LoginPage.jsx";
import { PassWordReset } from "./Pages/PasswordReset/PassWordReset.jsx";
import {Eregistrate1} from "./Pages/EhostRegistarte/EhostRstep1.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset" element={<PassWordReset />} />
      <Route path ="/Eregistrate1" element ={<Eregistrate1 />} />
    </Routes>
  );
}

export default App;