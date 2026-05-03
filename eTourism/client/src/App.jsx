import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./Pages/Login/LoginPage.jsx";
import { PassWordReset } from "./Pages/PasswordReset/PassWordReset.jsx";
import { EhostRegisterStep1 } from "./Pages/EhostRegister/EhostRegisterStep1.jsx";
import { EhostRegisterStep2 } from "./Pages/EhostRegister/EhostRegisterStep2.jsx";
import { EhostRegisterStep3 } from "./Pages/EhostRegister/EhostRegisterStep3.jsx";
import { EhostRegisterStep4 } from "./Pages/EhostRegister/EhostRegisterStep4.jsx";
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
import { VisitorProfile } from "./Pages/VisitorProfile/VisitorProfile.jsx";
import { ContinentPage } from "./Pages/ContinentPage/ContinentPage.jsx";
import { VisitorRegister } from "./Pages/VisitorRegister/VisitorRegister.jsx";
import { CompleteOAuthProfile } from "./Pages/VisitorRegister/CompleteOAuthProfile.jsx";
import { NetworkBanner } from "./components/NetworkBanner.jsx";




function App() {
  return (
    <>
      <NetworkBanner />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<PassWordReset />} />
        <Route path="/register/ehost/step1" element={<EhostRegisterStep1 />} />
        <Route path="/register/ehost/step2" element={<EhostRegisterStep2 />} />
        <Route path="/register/ehost/step3" element={<EhostRegisterStep3 />} />
        <Route path="/register/ehost/step4" element={<EhostRegisterStep4 />} />
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
        <Route path="/EditActivity/:id" element={<ApplyActivity />} />
        <Route path="/EhostProfile" element={<EhostProfile />} />
        <Route path="/VisitorProfile" element={<VisitorProfile />} />
        <Route path="/continent/:continent" element={<ContinentPage />} />
        <Route path="/register/visitor" element={<VisitorRegister />} />
        <Route path="/register/visitor/complete" element={<CompleteOAuthProfile />} />
      </Routes>
    </>
  );
}

export default App;