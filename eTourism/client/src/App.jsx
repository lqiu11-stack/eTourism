import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./Pages/Login/LoginPage.jsx";
import { PassWordReset } from "./Pages/PasswordReset/PassWordReset.jsx";
import { Eregistrate1 } from "./Pages/EhostRegistarte/EhostRstep1.jsx";
import { Eregistrate2 } from "./Pages/EhostRegistarte/EhostRstep2.jsx";
import { Eregistrate3 } from "./Pages/EhostRegistarte/EhostRstep3.jsx";
import { Eregistrate4 } from "./Pages/EhostRegistarte/EhostRstep4.jsx";
import { MainPage } from "./Pages/MainPage/MainPage.jsx";
import { DetailPage } from "./Pages/DetailPage/DetailPage.jsx";
function App() {
  return (

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<PassWordReset />} />
        <Route path="/Eregistrate1" element={<Eregistrate1 />} />
        <Route path="/Eregistrate2" element={<Eregistrate2 />} />
        <Route path="/Eregistrate3" element={<Eregistrate3 />} />
        <Route path="/Eregistrate4" element={<Eregistrate4 />} />
        <Route path="/MainPage" element={<MainPage />} />
        <Route path="/DetailPage" element={<DetailPage />} />
      </Routes>
  );
}

export default App;