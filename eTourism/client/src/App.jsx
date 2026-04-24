import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./Pages/Login/LoginPage.jsx";
import { PassWordReset } from "./Pages/PasswordReset/PassWordReset.jsx";
import { Eregistrate1 } from "./Pages/EhostRegistarte/EhostRstep1.jsx";
import { Eregistrate2 } from "./Pages/EhostRegistarte/EhostRstep2.jsx";
import { Eregistrate3 } from "./Pages/EhostRegistarte/EhostRstep3.jsx";
import { Eregistrate4 } from "./Pages/EhostRegistarte/EhostRstep4.jsx";
import { MainPage } from "./Pages/MainPage/MainPage.jsx";
import { DetailPage } from "./Pages/DetailPage/DetailPage.jsx";
import { PaymentPage } from "./Pages/PaymentPage/PaymentPage.jsx";
import { Dashboard } from "./Pages/AdminDashboard/AdminDashboard.jsx";
import { PaymentSuccessPage } from "./Pages/PaymentSuccess/PaymentSuccess.jsx";
import { MyBooking } from "./Pages/MyBooking/MyBooking.jsx";
import { MyBookingDetail } from "./Pages/BookingDetail/BookingDetail.jsx";
import { RefundPage } from "./Pages/RefundPage/RefundPage.jsx";
import { MapPage } from "./Pages/MapPage/MapPage.jsx";
import { EhostDashboard } from "./Pages/EhostDashboard/EhostDashboard.jsx";
import { ApplyActivity } from "./Pages/ApplyActivity/ApplyActivity.jsx";
import { EhostProfile } from "./Pages/EhostProfile/EhostProfile.jsx";
import { VisitorRegistrate } from "./Pages/VisitorRegistrate/VisitorRegistrate.jsx";





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
        <Route path="/PaymentPage" element={<PaymentPage />} />
        <Route path="/Dashboard" element={<Dashboard  />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/MyBooking" element={<MyBooking />} />
        <Route path="/MyBookingDetail" element={<MyBookingDetail />} />
        <Route path="/RefundPage" element={<RefundPage />} />
        <Route path="/MapPage" element={< MapPage />} />
        <Route path="/EhostDashboard" element={<EhostDashboard />} />
        <Route path="/ApplyActivity" element={<ApplyActivity />} />
        <Route path="/EhostProfile" element={<EhostProfile />} />
        <Route path="/VisitorRegistrate" element={<VisitorRegistrate />} />
      </Routes>
  );
}

export default App;